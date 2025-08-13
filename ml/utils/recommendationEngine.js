/**
 * DirectRent UK - Recommendation Engine
 * JavaScript implementation of the hybrid recommendation system
 * Replaces Python collaborative filtering with matrix-factorization
 */

const { Matrix } = require('ml-matrix');
const { similarity } = require('ml-distance');
const matrixFactorization = require('matrix-factorization');
const fs = require('fs');
const path = require('path');

class RecommendationEngine {
  /**
   * Hybrid recommendation engine combining collaborative and content-based filtering
   */
  constructor() {
    this.contentModel = null;
    this.collaborativeModel = null;
    this.propertyFeatures = [];
    this.userPreferences = [];
    this.propertyIndex = {};
    this.userIndex = {};
    this.modelPath = path.join(process.cwd(), 'ml', 'models', 'recommendation');
  }

  /**
   * Train the recommendation models
   * @param {Object} data - Training data with user-property interactions and property features
   * @param {Object} options - Training options
   * @returns {Object} Trained models
   */
  async trainModels(data, options = {}) {
    // Train collaborative filtering model
    await this.trainCollaborativeModel(data.interactions, options);
    
    // Train content-based model
    this.trainContentModel(data.properties, options);
    
    // Save models
    await this.saveModels();
    
    return {
      collaborativeModel: this.collaborativeModel,
      contentModel: this.contentModel
    };
  }

  /**
   * Train the collaborative filtering model using matrix factorization
   * @param {Array} interactions - User-property interactions
   * @param {Object} options - Training options
   * @returns {Object} Trained model
   */
  async trainCollaborativeModel(interactions, options = {}) {
    // Process interactions into user-item matrix format
    const userIds = [...new Set(interactions.map(i => i.user_id))];
    const propertyIds = [...new Set(interactions.map(i => i.property_id))];
    
    // Create indexes
    this.userIndex = {};
    userIds.forEach((id, index) => {
      this.userIndex[id] = index;
    });
    
    this.propertyIndex = {};
    propertyIds.forEach((id, index) => {
      this.propertyIndex[id] = index;
    });
    
    // Create a rating matrix
    const ratingMatrix = Array(userIds.length).fill().map(() => Array(propertyIds.length).fill(0));
    
    // Fill in known ratings
    interactions.forEach(interaction => {
      const userIdx = this.userIndex[interaction.user_id];
      const itemIdx = this.propertyIndex[interaction.property_id];
      ratingMatrix[userIdx][itemIdx] = this.interactionToRating(interaction);
    });
    
    // Configure matrix factorization
    const factors = options.factors || 10;
    const iterations = options.iterations || 100;
    const lambda = options.lambda || 0.1;
    
    // Train model using matrix factorization
    console.log(`Training collaborative filtering model with ${interactions.length} interactions...`);
    try {
      // factorizeMatrix returns [P, Q] where P is user factors and Q is item factors
      const [userFactors, itemFactors] = matrixFactorization.factorizeMatrix(
        ratingMatrix, 
        factors, 
        iterations, 
        0.0002,  // learning rate
        lambda   // regularization parameter
      );
      
      // Store the model
      this.collaborativeModel = {
        userFactors: userFactors,
        itemFactors: itemFactors,
        predict: (userIdx, itemIdx) => {
          // Matrix multiplication of corresponding user and item factors
          return userFactors[userIdx].reduce((sum, val, i) => sum + val * itemFactors[i][itemIdx], 0);
        },
        serialize: () => {
          return {
            userFactors: userFactors,
            itemFactors: itemFactors
          };
        },
        deserialize: (data) => {
          this.collaborativeModel.userFactors = data.userFactors;
          this.collaborativeModel.itemFactors = data.itemFactors;
        }
      };
      
      return this.collaborativeModel;
    } catch (error) {
      console.error('Error during matrix factorization:', error);
      throw error;
    }
  }

  /**
   * Train the content-based filtering model
   * @param {Array} properties - Property listings with features
   * @param {Object} options - Training options
   * @returns {Matrix} Feature matrix
   */
  trainContentModel(properties, options = {}) {
    // Extract property features
    const featureNames = [
      'bedrooms', 'bathrooms', 'price_per_month',
      'property_type_encoded', 'city_encoded',
      'latitude', 'longitude'
    ];
    
    // Filter available features
    const availableFeatures = featureNames.filter(feature => 
      properties[0] && properties[0][feature] !== undefined
    );
    
    // Create property matrix
    const matrix = [];
    const propertyIds = [];
    
    properties.forEach(property => {
      const features = availableFeatures.map(feature => {
        return property[feature] !== undefined ? Number(property[feature]) : 0;
      });
      
      matrix.push(features);
      propertyIds.push(property.id);
    });
    
    // Store content model data
    this.contentModel = {
      featureMatrix: new Matrix(matrix),
      propertyIds: propertyIds,
      featureNames: availableFeatures
    };
    
    // Create property index for content model
    this.contentModel.propertyIndex = {};
    propertyIds.forEach((id, index) => {
      this.contentModel.propertyIndex[id] = index;
    });
    
    return this.contentModel;
  }

  /**
   * Save trained models
   */
  async saveModels() {
    // Create directory if needed
    if (!fs.existsSync(this.modelPath)) {
      fs.mkdirSync(this.modelPath, { recursive: true });
    }
    
    // Save collaborative model
    if (this.collaborativeModel) {
      const collabModelData = {
        model: this.collaborativeModel.serialize(),
        userIndex: this.userIndex,
        propertyIndex: this.propertyIndex,
        created_at: new Date().toISOString()
      };
      
      fs.writeFileSync(
        path.join(this.modelPath, 'collaborative_model.json'),
        JSON.stringify(collabModelData, null, 2)
      );
    }
    
    // Save content model
    if (this.contentModel) {
      const contentModelData = {
        featureMatrix: this.contentModel.featureMatrix.to2DArray(),
        propertyIds: this.contentModel.propertyIds,
        featureNames: this.contentModel.featureNames,
        propertyIndex: this.contentModel.propertyIndex,
        created_at: new Date().toISOString()
      };
      
      fs.writeFileSync(
        path.join(this.modelPath, 'content_model.json'),
        JSON.stringify(contentModelData, null, 2)
      );
    }
    
    console.log(`Recommendation models saved to ${this.modelPath}`);
  }

  /**
   * Load pre-trained models
   * @returns {boolean} Success indicator
   */
  loadModels() {
    try {
      // Load collaborative model
      const collabPath = path.join(this.modelPath, 'collaborative_model.json');
      if (fs.existsSync(collabPath)) {
        const collabData = JSON.parse(fs.readFileSync(collabPath, 'utf8'));
        
        // Recreate model
        this.collaborativeModel = {
          userFactors: collabData.model.userFactors,
          itemFactors: collabData.model.itemFactors,
          predict: (userIdx, itemIdx) => {
            // Matrix multiplication of corresponding user and item factors
            return collabData.model.userFactors[userIdx].reduce(
              (sum, val, i) => sum + val * collabData.model.itemFactors[i][itemIdx], 
              0
            );
          },
          serialize: () => {
            return {
              userFactors: collabData.model.userFactors,
              itemFactors: collabData.model.itemFactors
            };
          },
          deserialize: (data) => {
            this.collaborativeModel.userFactors = data.userFactors;
            this.collaborativeModel.itemFactors = data.itemFactors;
          }
        };
        
        this.userIndex = collabData.userIndex;
        this.propertyIndex = collabData.propertyIndex;
      }
      
      // Load content model
      const contentPath = path.join(this.modelPath, 'content_model.json');
      if (fs.existsSync(contentPath)) {
        const contentData = JSON.parse(fs.readFileSync(contentPath, 'utf8'));
        
        this.contentModel = {
          featureMatrix: new Matrix(contentData.featureMatrix),
          propertyIds: contentData.propertyIds,
          featureNames: contentData.featureNames,
          propertyIndex: contentData.propertyIndex
        };
      }
      
      console.log('Recommendation models loaded successfully');
      return true;
    } catch (error) {
      console.error('Error loading recommendation models:', error);
      return false;
    }
  }

  /**
   * Convert interaction types to numerical ratings
   * @param {Object} interaction - User-property interaction
   * @returns {number} Rating value
   */
  interactionToRating(interaction) {
    // Convert interaction type to numerical rating
    switch (interaction.interaction_type) {
      case 'view':
        return 1;
      case 'save':
        return 3;
      case 'inquiry':
        return 4;
      case 'contact':
        return 5;
      default:
        return 1;
    }
  }

  /**
   * Get content-based recommendations
   * @param {Object} userPreferences - User preferences
   * @param {Array} properties - Available properties
   * @param {number} limit - Maximum number of recommendations
   * @returns {Array} Recommendations with scores
   */
  getContentBasedRecommendations(userPreferences, properties, limit = 10) {
    if (!this.contentModel) {
      if (!this.loadModels()) {
        throw new Error('Content model not available');
      }
    }
    
    // Create preference vector from user preferences
    const preferenceVector = [];
    
    if (this.contentModel.featureNames.includes('bedrooms') && userPreferences.bedrooms) {
      preferenceVector.push(Number(userPreferences.bedrooms));
    } else {
      preferenceVector.push(2); // Default value
    }
    
    if (this.contentModel.featureNames.includes('bathrooms') && userPreferences.bathrooms) {
      preferenceVector.push(Number(userPreferences.bathrooms));
    } else {
      preferenceVector.push(1); // Default value
    }
    
    if (this.contentModel.featureNames.includes('price_per_month')) {
      // Use the midpoint of the price range
      const minPrice = Number(userPreferences.price_min) || 500;
      const maxPrice = Number(userPreferences.price_max) || 3000;
      preferenceVector.push((minPrice + maxPrice) / 2);
    }
    
    // Other features would go here, but we'll use default values for simplicity
    
    // Calculate similarity scores with properties
    const scores = [];
    
    properties.forEach(property => {
      // Extract features matching the content model
      const features = this.contentModel.featureNames.map(feature => {
        return property[feature] !== undefined ? Number(property[feature]) : 0;
      });
      
      // Calculate cosine similarity
      const similarity_score = similarity.cosine(preferenceVector, features);
      
      scores.push({
        property_id: property.id,
        property: property,
        score: similarity_score,
        reason: 'Matches your preferences'
      });
    });
    
    // Sort by score and limit results
    return scores
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  /**
   * Get collaborative filtering recommendations
   * @param {string} userId - User ID
   * @param {Array} properties - Available properties
   * @param {number} limit - Maximum number of recommendations
   * @returns {Array} Recommendations with scores
   */
  getCollaborativeRecommendations(userId, properties, limit = 10) {
    if (!this.collaborativeModel) {
      if (!this.loadModels()) {
        throw new Error('Collaborative model not available');
      }
    }
    
    // Check if user exists in the model
    const userIdx = this.userIndex[userId];
    if (userIdx === undefined) {
      // User not in model, return empty results
      return [];
    }
    
    const recommendations = [];
    
    // Get predictions for each property
    properties.forEach(property => {
      const propertyIdx = this.propertyIndex[property.id];
      
      // Skip if property not in model
      if (propertyIdx === undefined) {
        return;
      }
      
      // Get prediction
      const score = this.collaborativeModel.predict(userIdx, propertyIdx);
      
      recommendations.push({
        property_id: property.id,
        property: property,
        score: score,
        reason: 'People with similar preferences liked this'
      });
    });
    
    // Sort by score and limit results
    return recommendations
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  /**
   * Get hybrid recommendations combining collaborative and content-based filtering
   * @param {string} userId - User ID
   * @param {Object} userPreferences - User preferences
   * @param {Array} properties - Available properties
   * @param {Object} options - Options including limit and weights
   * @returns {Array} Hybrid recommendations
   */
  getHybridRecommendations(userId, userPreferences, properties, options = {}) {
    // Set defaults
    const limit = options.limit || 10;
    const contentWeight = options.contentWeight || 0.6;
    const collabWeight = options.collabWeight || 0.4;
    
    // Get recommendations from both models
    let contentRecs;
    try {
      contentRecs = this.getContentBasedRecommendations(userPreferences, properties, limit * 2);
    } catch (error) {
      console.error('Error getting content-based recommendations:', error);
      contentRecs = [];
    }
    
    let collabRecs;
    try {
      collabRecs = this.getCollaborativeRecommendations(userId, properties, limit * 2);
    } catch (error) {
      console.error('Error getting collaborative recommendations:', error);
      collabRecs = [];
    }
    
    // Create map for easy lookup
    const contentScores = new Map();
    contentRecs.forEach(rec => {
      contentScores.set(rec.property_id, {
        score: rec.score,
        reason: rec.reason
      });
    });
    
    const collabScores = new Map();
    collabRecs.forEach(rec => {
      collabScores.set(rec.property_id, {
        score: rec.score,
        reason: rec.reason
      });
    });
    
    // Combine all unique property IDs
    const allPropertyIds = new Set([
      ...contentRecs.map(r => r.property_id),
      ...collabRecs.map(r => r.property_id)
    ]);
    
    // Calculate hybrid scores
    const hybridRecs = [];
    
    for (const propertyId of allPropertyIds) {
      const property = properties.find(p => p.id === propertyId);
      if (!property) continue;
      
      const contentScore = contentScores.has(propertyId) ? 
        contentScores.get(propertyId).score : 0;
      
      const collabScore = collabScores.has(propertyId) ? 
        collabScores.get(propertyId).score : 0;
      
      // Calculate weighted score
      const hybridScore = (contentScore * contentWeight) + (collabScore * collabWeight);
      
      // Determine reason
      let reason = '';
      const reasons = [];
      
      if (contentScores.has(propertyId)) {
        reasons.push(contentScores.get(propertyId).reason);
      }
      
      if (collabScores.has(propertyId)) {
        reasons.push(collabScores.get(propertyId).reason);
      }
      
      reason = reasons.join('; ');
      
      hybridRecs.push({
        property_id: propertyId,
        property: property,
        score: hybridScore,
        reason: reason
      });
    }
    
    // Sort by score and limit results
    return hybridRecs
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }
}

module.exports = {
  RecommendationEngine
};

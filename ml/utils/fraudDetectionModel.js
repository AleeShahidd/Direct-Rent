/**
 * DirectRent UK - Fraud Detection Model
 * JavaScript implementation of the fraud detection system
 * Replaces Python sklearn models with ml-random-forest
 */

const { RandomForestClassifier } = require('ml-random-forest');
const natural = require('natural');
const CryptoJS = require('crypto-js');
const fs = require('fs');
const path = require('path');

class FraudDetectionModel {
  /**
   * ML-based fraud detection model with rule-based components
   */
  constructor() {
    this.model = null;
    this.modelPath = path.join(process.cwd(), 'ml', 'models', 'fraud_model.json');
    this.featureNames = [];
    this.tokenizer = new natural.WordTokenizer();
    this.suspiciousKeywords = [
      'urgent', 'cash only', 'no viewings', 'overseas', 'western union',
      'money transfer', 'discount', 'immediate', 'no questions', 'no contract',
      'no background check', 'no references', 'no credit check', 'pay upfront',
      'avoid fees', 'direct only', 'no agents', 'no paperwork'
    ];
  }

  /**
   * Train the fraud detection model
   * @param {Object} data - Training data
   * @param {Object} options - Training options
   * @returns {Object} Trained model
   */
  trainModel(data, options = {}) {
    const { X, y, featureNames } = data;
    this.featureNames = featureNames;
    
    // Configure RandomForest parameters
    const rfOptions = {
      seed: 42,
      maxFeatures: options.maxFeatures || 0.8,
      replacement: options.replacement || true,
      nEstimators: options.nEstimators || 100,
      treeOptions: {
        maxDepth: options.maxDepth || 10,
        minNumSamples: options.minNumSamples || 5
      }
    };
    
    // Train model
    console.log(`Training fraud detection model with ${X.length} samples...`);
    this.model = new RandomForestClassifier(rfOptions);
    this.model.train(X, y);
    
    // Save model
    this.saveModel();
    
    return this.model;
  }

  /**
   * Save the trained model and metadata
   */
  saveModel() {
    if (!this.model) {
      throw new Error('No model to save');
    }
    
    // Convert model to JSON
    const modelJson = JSON.stringify({
      model: this.model.toJSON(),
      featureNames: this.featureNames,
      created_at: new Date().toISOString(),
      version: '1.0.0'
    });
    
    // Create directory if needed
    const modelDir = path.dirname(this.modelPath);
    if (!fs.existsSync(modelDir)) {
      fs.mkdirSync(modelDir, { recursive: true });
    }
    
    // Save model
    fs.writeFileSync(this.modelPath, modelJson);
    console.log(`Fraud detection model saved to ${this.modelPath}`);
  }

  /**
   * Load a pre-trained model
   * @returns {boolean} Success indicator
   */
  loadModel() {
    try {
      if (!fs.existsSync(this.modelPath)) {
        console.error('Fraud detection model file not found');
        return false;
      }
      
      // Load model from file
      const modelJson = JSON.parse(fs.readFileSync(this.modelPath, 'utf8'));
      
      // Recreate model from JSON
      this.model = RandomForestClassifier.load(modelJson.model);
      this.featureNames = modelJson.featureNames || [];
      
      console.log('Fraud detection model loaded successfully');
      return true;
    } catch (error) {
      console.error('Error loading fraud detection model:', error);
      return false;
    }
  }

  /**
   * Extract features from property data for fraud detection
   * @param {Object} propertyData - Property listing data
   * @returns {Array} Feature vector
   */
  extractFeatures(propertyData) {
    // Initialize features array
    const features = Array(this.featureNames.length).fill(0);
    
    // Map feature names to indices
    const featureMap = {};
    this.featureNames.forEach((name, index) => {
      featureMap[name] = index;
    });
    
    // Extract basic property features
    ['bedrooms', 'bathrooms', 'price_per_month'].forEach(key => {
      if (key in featureMap && propertyData[key] !== undefined) {
        features[featureMap[key]] = Number(propertyData[key]);
      }
    });
    
    // Price anomaly feature
    if ('price_anomaly' in featureMap && propertyData.price_anomaly) {
      features[featureMap['price_anomaly']] = propertyData.price_anomaly;
    }
    
    // Text features
    if (propertyData.title || propertyData.description) {
      const text = [propertyData.title, propertyData.description].filter(Boolean).join(' ').toLowerCase();
      
      // Count suspicious keywords
      if ('suspicious_keyword_count' in featureMap) {
        const keywordCount = this.suspiciousKeywords.reduce((count, keyword) => {
          return count + (text.includes(keyword) ? 1 : 0);
        }, 0);
        features[featureMap['suspicious_keyword_count']] = keywordCount;
      }
      
      // Sentiment analysis
      if ('text_sentiment' in featureMap) {
        const analyzer = new natural.SentimentAnalyzer('English', natural.PorterStemmer, 'afinn');
        const tokens = this.tokenizer.tokenize(text);
        const sentiment = analyzer.getSentiment(tokens);
        features[featureMap['text_sentiment']] = sentiment;
      }
    }
    
    // Image features
    if ('image_count' in featureMap && Array.isArray(propertyData.images)) {
      features[featureMap['image_count']] = propertyData.images.length;
    }
    
    // Landlord history
    if ('landlord_listing_count' in featureMap && propertyData.landlord_listing_count) {
      features[featureMap['landlord_listing_count']] = propertyData.landlord_listing_count;
    }
    
    return features;
  }

  /**
   * Detect potential fraud in a property listing
   * @param {Object} propertyData - Property listing data
   * @returns {Object} Fraud detection results
   */
  detectFraud(propertyData) {
    const useMlModel = this.model !== null;
    let fraudScore = 0;
    const reasons = [];
    const riskFactors = {
      price_deviation: 0,
      content_analysis: 0,
      image_authenticity: 0,
      posting_frequency: 0
    };
    
    // 1. Price analysis
    const price = Number(propertyData.price_per_month) || 0;
    const marketAvg = propertyData.market_average || 1500;
    
    if (price < marketAvg * 0.5) {
      fraudScore += 0.4;
      riskFactors.price_deviation = 0.4;
      reasons.push('Price significantly below market average');
    } else if (price > marketAvg * 2) {
      fraudScore += 0.2;
      riskFactors.price_deviation = 0.2;
      reasons.push('Price significantly above market average');
    }
    
    // 2. Content analysis
    const title = propertyData.title || '';
    const description = propertyData.description || '';
    const textContent = (title + ' ' + description).toLowerCase();
    
    let keywordCount = 0;
    this.suspiciousKeywords.forEach(keyword => {
      if (textContent.includes(keyword)) {
        keywordCount++;
        reasons.push(`Contains suspicious keyword: ${keyword}`);
      }
    });
    
    if (keywordCount > 0) {
      const contentRisk = Math.min(0.05 * keywordCount, 0.4);
      fraudScore += contentRisk;
      riskFactors.content_analysis = contentRisk;
    }
    
    // 3. Image analysis
    const images = propertyData.images || [];
    if (images.length === 0) {
      fraudScore += 0.2;
      riskFactors.image_authenticity = 0.2;
      reasons.push('No images provided');
    } else if (images.length < 3) {
      fraudScore += 0.1;
      riskFactors.image_authenticity = 0.1;
      reasons.push('Very few images provided');
    }
    
    // 4. Posting frequency check
    const landlordListingCount = propertyData.landlord_listing_count || 0;
    if (landlordListingCount > 20) {
      fraudScore += 0.2;
      riskFactors.posting_frequency = 0.2;
      reasons.push('Unusually high number of listings by this landlord');
    }
    
    // 5. ML model prediction (if available)
    if (useMlModel) {
      try {
        // Extract features for the model
        const features = this.extractFeatures(propertyData);
        
        // Make prediction (returns probabilities for each class)
        const prediction = this.model.predict([features]);
        const mlFraudProbability = prediction[0] === 1 ? 
          this.model.predictProbability([features])[0][1] : 0;
        
        // Adjust fraud score based on ML prediction
        const mlWeight = 0.6;
        fraudScore = (fraudScore * (1 - mlWeight)) + (mlFraudProbability * mlWeight);
        
        if (mlFraudProbability > 0.7) {
          reasons.push('ML model detected high fraud probability');
        }
      } catch (error) {
        console.error('Error in ML fraud prediction:', error);
      }
    }
    
    // Ensure score is between 0 and 1
    fraudScore = Math.min(Math.max(fraudScore, 0), 1);
    
    // Determine if fraudulent based on threshold
    const isFraudulent = fraudScore > 0.6;
    
    return {
      fraud_score: Math.round(fraudScore * 100) / 100,
      is_fraudulent: isFraudulent,
      reasons,
      risk_factors: riskFactors,
      ml_model_used: useMlModel
    };
  }
  
  /**
   * Generate training data from property listings
   * @param {Array} propertyListings - Array of property listings
   * @param {Array} knownFraudIds - Array of known fraudulent listing IDs
   * @returns {Object} Training data
   */
  generateTrainingData(propertyListings, knownFraudIds = []) {
    // Define feature names
    this.featureNames = [
      'bedrooms', 'bathrooms', 'price_per_month', 
      'price_anomaly', 'suspicious_keyword_count',
      'text_sentiment', 'image_count', 'landlord_listing_count'
    ];
    
    // Generate features and labels
    const X = [];
    const y = [];
    
    propertyListings.forEach(property => {
      // Mark as fraud if in known fraud list or by heuristics
      const isFraud = knownFraudIds.includes(property.id) || 
                      this.fraudHeuristics(property);
      
      // Extract features
      const features = [];
      
      // Basic features
      features.push(Number(property.bedrooms) || 0);
      features.push(Number(property.bathrooms) || 0);
      features.push(Number(property.price_per_month) || 0);
      
      // Price anomaly (z-score)
      const marketAvg = 1500; // Default, should be calculated from data
      const marketStd = 500;  // Default, should be calculated from data
      const priceZscore = Math.abs((property.price_per_month - marketAvg) / marketStd);
      features.push(priceZscore);
      
      // Text features
      const text = [property.title, property.description].filter(Boolean).join(' ').toLowerCase();
      
      // Count suspicious keywords
      const keywordCount = this.suspiciousKeywords.reduce((count, keyword) => {
        return count + (text.includes(keyword) ? 1 : 0);
      }, 0);
      features.push(keywordCount);
      
      // Sentiment analysis
      const analyzer = new natural.SentimentAnalyzer('English', natural.PorterStemmer, 'afinn');
      const tokens = this.tokenizer.tokenize(text);
      const sentiment = analyzer.getSentiment(tokens);
      features.push(sentiment);
      
      // Image count
      features.push(Array.isArray(property.images) ? property.images.length : 0);
      
      // Landlord listing count
      features.push(property.landlord_listing_count || 0);
      
      X.push(features);
      y.push(isFraud ? 1 : 0);
    });
    
    return { X, y, featureNames: this.featureNames };
  }

  /**
   * Apply heuristic rules to detect potential fraud
   * @param {Object} property - Property listing
   * @returns {boolean} Fraud indicator
   */
  fraudHeuristics(property) {
    // Price too low compared to typical market value
    const marketAvg = 1500; // Default for demonstration
    if (property.price_per_month < marketAvg * 0.3) {
      return true;
    }
    
    // No images
    if (!property.images || property.images.length === 0) {
      return true;
    }
    
    // Multiple suspicious keywords
    const text = [property.title, property.description].filter(Boolean).join(' ').toLowerCase();
    let keywordCount = 0;
    this.suspiciousKeywords.forEach(keyword => {
      if (text.includes(keyword)) {
        keywordCount++;
      }
    });
    
    if (keywordCount >= 3) {
      return true;
    }
    
    return false;
  }
}

module.exports = {
  FraudDetectionModel
};

/**
 * DirectRent UK - Recommendation Model Training Script
 * Trains and saves hybrid recommendation models
 */

const path = require('path');
const fs = require('fs');
const { UKHousingDataProcessor } = require('../../ml/utils/dataProcessor');
const { RecommendationEngine } = require('../../ml/utils/recommendationEngine');
const { v4: uuidv4 } = require('uuid');

async function trainRecommendationModel() {
  console.log('Starting recommendation model training...');
  
  try {
    // Initialize data processor
    const dataProcessor = new UKHousingDataProcessor();
    
    // Process dataset
    console.log('Processing dataset...');
    let processedData = await dataProcessor.processFullDataset();
    
    // Check if we have valid processed data, if not, create mock data
    if (!processedData || processedData.length === 0) {
      console.log('No processed data available, generating mock data...');
      processedData = dataProcessor._createMockDataset();
      
      // Add IDs to ensure each property has an ID
      processedData = processedData.map((property, index) => ({
        ...property,
        id: property.id || property.property_id || `prop_${index}`
      }));
      
      console.log(`Created ${processedData.length} mock properties for training`);
    }
    
    // Since we don't have real user interaction data, we'll generate synthetic data
    console.log('Generating synthetic user interactions for training...');
    
    const userCount = 200;
    const interactionsPerUser = 15;
    
    // Generate synthetic users
    const users = Array.from({ length: userCount }, () => ({
      id: uuidv4(),
      preferences: {
        min_bedrooms: Math.floor(Math.random() * 3) + 1,
        price_min: 500 + Math.floor(Math.random() * 1000),
        price_max: 1500 + Math.floor(Math.random() * 3000),
        property_type: ['Flat', 'House', 'Studio'][Math.floor(Math.random() * 3)]
      }
    }));
    
    // Generate interactions
    const interactions = [];
    const interactionTypes = ['view', 'save', 'inquiry', 'contact'];
    
    users.forEach(user => {
      // Filter properties that match user preferences
      const matchingProperties = processedData.filter(property => {
        // Bedrooms match
        const bedroomsMatch = property.bedrooms >= user.preferences.min_bedrooms;
        
        // Price range match
        const priceMatch = property.price_per_month >= user.preferences.price_min &&
                          property.price_per_month <= user.preferences.price_max;
        
        // Property type match (if specified)
        const typeMatch = !user.preferences.property_type || 
                         property.property_type === user.preferences.property_type;
        
        return bedroomsMatch && priceMatch && typeMatch;
      });
      
      // If no matching properties, use random ones
      const propertiesToInteractWith = matchingProperties.length > 0 ? 
        matchingProperties : processedData;
      
      // Generate interactions for this user
      for (let i = 0; i < interactionsPerUser; i++) {
        // Randomly select a property (with some bias towards first results)
        const randomIndex = Math.floor(Math.random() * Math.random() * propertiesToInteractWith.length);
        const property = propertiesToInteractWith[randomIndex] || {};
        
        // Ensure property has an ID
        const propertyId = property.id || property.property_id || `prop_${randomIndex}`;
        
        // Random interaction type (weighted towards views)
        const typeIndex = Math.floor(Math.pow(Math.random(), 2) * interactionTypes.length);
        const interactionType = interactionTypes[typeIndex];
        
        interactions.push({
          user_id: user.id,
          property_id: propertyId,
          interaction_type: interactionType,
          timestamp: new Date().toISOString()
        });
      }
    });
    
    console.log(`Generated ${interactions.length} synthetic interactions for ${userCount} users`);
    
    // Initialize recommendation engine
    const recommendationEngine = new RecommendationEngine();
    
    // Train models
    console.log('Training recommendation models...');
    await recommendationEngine.trainModels({
      properties: processedData,
      interactions: interactions
    }, {
      factors: 10,
      iterations: 50
    });
    
    console.log('Recommendation model training completed successfully!');
    console.log(`Models saved to ${recommendationEngine.modelPath}`);
    
    // Test recommendations for a random user
    const testUser = users[Math.floor(Math.random() * users.length)];
    console.log('\nTesting recommendations for random user:');
    console.log(`User ID: ${testUser.id}`);
    console.log('Preferences:', testUser.preferences);
    
    try {
      const recommendations = recommendationEngine.getHybridRecommendations(
        testUser.id, 
        testUser.preferences,
        processedData,
        { limit: 5 }
      );
      
      console.log('\nTop 5 recommendations:');
      if (recommendations && recommendations.length > 0) {
        recommendations.forEach((rec, index) => {
          // Ensure property exists and has the required properties
          const property = rec.property || {};
          const price = property.price_per_month ? `£${property.price_per_month}` : 'Price not available';
          const title = property.title || `Property ${rec.property_id || index}`;
          
          console.log(`${index + 1}. ${title} - ${price}`);
          console.log(`   Score: ${rec.score.toFixed(4)}, Reason: ${rec.reason || 'Not specified'}`);
        });
      } else {
        console.log('No recommendations found for this user.');
      }
    } catch (error) {
      console.log('Error getting recommendations:', error.message);
    }
    
  } catch (error) {
    console.log('Error training recommendation model:', error);
  }
}

// Run training
trainRecommendationModel();

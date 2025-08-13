/**
 * DirectRent UK - Fraud Detection Model Training Script
 * Trains and saves a Random Forest model for fraud detection
 */

const path = require('path');
const fs = require('fs');
const { UKHousingDataProcessor } = require('../../ml/utils/dataProcessor');
const { FraudDetectionModel } = require('../../ml/utils/fraudDetectionModel');

async function trainFraudModel() {
  console.log('Starting fraud detection model training...');
  
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
    
    // Initialize fraud detection model
    const fraudModel = new FraudDetectionModel();
    
    // Since we don't have labeled fraud data, we'll create synthetic fraud examples
    console.log('Generating synthetic fraud examples for training...');
    
    // Create synthetic fraud examples (approximately 5% of dataset)
    const knownFraudIds = [];
    const fraudCount = Math.ceil(processedData.length * 0.05);
    
    for (let i = 0; i < fraudCount; i++) {
      // Randomly select an index
      const randomIndex = Math.floor(Math.random() * processedData.length);
      const property = processedData[randomIndex];
      
      // Only add if not already in the list
      if (property.id && !knownFraudIds.includes(property.id)) {
        knownFraudIds.push(property.id);
        
        // Modify the property to make it more likely to be fraudulent
        property.price_per_month = property.price_per_month * 0.3; // Unusually low price
        property.images = []; // No images
        property.description = property.description || '' + ' URGENT cash only no questions western union immediate discount';
      }
    }
    
    console.log(`Created ${knownFraudIds.length} synthetic fraud examples`);
    
    // Generate training data
    const trainingData = fraudModel.generateTrainingData(processedData, knownFraudIds);
    console.log(`Generated training data with ${trainingData.X.length} samples`);
    
    // Check if we have enough data to train
    if (!trainingData.X || trainingData.X.length === 0) {
      console.log('Insufficient data for training. Creating synthetic training data...');
      
      // Create synthetic training data with at least 100 samples
      const syntheticX = [];
      const syntheticY = [];
      
      for (let i = 0; i < 100; i++) {
        // Generate random feature vector (using basic properties like bedrooms, price, etc.)
        const features = [
          Math.floor(Math.random() * 5) + 1,  // bedrooms
          Math.floor(Math.random() * 3) + 1,  // bathrooms
          500 + Math.floor(Math.random() * 2000), // price
          Math.random() * 3,  // price anomaly (z-score)
          Math.floor(Math.random() * 3),  // suspicious keyword count
          Math.random() * 2 - 1,  // text sentiment
          Math.floor(Math.random() * 10),  // image count
          Math.floor(Math.random() * 20)   // landlord listing count
        ];
        
        // 10% of samples are fraudulent
        const isFraud = Math.random() < 0.1;
        
        syntheticX.push(features);
        syntheticY.push(isFraud ? 1 : 0);
      }
      
      trainingData.X = syntheticX;
      trainingData.y = syntheticY;
      trainingData.featureNames = [
        'bedrooms', 'bathrooms', 'price_per_month', 
        'price_anomaly', 'suspicious_keyword_count',
        'text_sentiment', 'image_count', 'landlord_listing_count'
      ];
      
      console.log(`Created synthetic training data with ${trainingData.X.length} samples`);
    }
    
    // Split data into training and testing sets
    const trainSize = Math.floor(trainingData.X.length * 0.8);
    const indices = Array.from({ length: trainingData.X.length }, (_, i) => i);
    
    // Shuffle indices
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }
    
    // Create train/test split
    const trainIndices = indices.slice(0, trainSize);
    const testIndices = indices.slice(trainSize);
    
    const X_train = trainIndices.map(i => trainingData.X[i]);
    const y_train = trainIndices.map(i => trainingData.y[i]);
    const X_test = testIndices.map(i => trainingData.X[i]);
    const y_test = testIndices.map(i => trainingData.y[i]);
    
    // Train model
    console.log(`Training fraud detection model with ${X_train.length} samples...`);
    fraudModel.trainModel(
      { X: X_train, y: y_train, featureNames: trainingData.featureNames }, 
      { nEstimators: 100, maxDepth: 10 }
    );
    
    // Evaluate model
    console.log('Evaluating model on test data...');
    let correctPredictions = 0;
    let trueFraud = 0;
    let predictedFraud = 0;
    let truePositives = 0;
    
    for (let i = 0; i < X_test.length; i++) {
      const prediction = fraudModel.model.predict([X_test[i]])[0];
      const actual = y_test[i];
      
      if (prediction === actual) correctPredictions++;
      if (actual === 1) trueFraud++;
      if (prediction === 1) predictedFraud++;
      if (prediction === 1 && actual === 1) truePositives++;
    }
    
    const accuracy = correctPredictions / X_test.length;
    const precision = predictedFraud > 0 ? truePositives / predictedFraud : 0;
    const recall = trueFraud > 0 ? truePositives / trueFraud : 0;
    const f1Score = precision + recall > 0 ? 2 * precision * recall / (precision + recall) : 0;
    
    const evaluation = {
      accuracy,
      precision,
      recall,
      f1_score: f1Score,
      sample_count: X_test.length,
      fraud_count: trueFraud
    };
    
    console.log('Model evaluation results:');
    console.log(`- Accuracy: ${(accuracy * 100).toFixed(2)}%`);
    console.log(`- Precision: ${(precision * 100).toFixed(2)}%`);
    console.log(`- Recall: ${(recall * 100).toFixed(2)}%`);
    console.log(`- F1 Score: ${(f1Score * 100).toFixed(2)}%`);
    
    // Save evaluation metrics
    const modelDir = path.dirname(fraudModel.modelPath);
    if (!fs.existsSync(modelDir)) {
      fs.mkdirSync(modelDir, { recursive: true });
    }
    
    const metricsPath = path.join(modelDir, 'evaluation.json');
    fs.writeFileSync(
      metricsPath,
      JSON.stringify({ ...evaluation, timestamp: new Date().toISOString() }, null, 2)
    );
    
    console.log('Fraud detection model training completed successfully!');
    console.log(`Model saved to ${fraudModel.modelPath}`);
    
  } catch (error) {
    console.error('Error training fraud detection model:', error);
  }
}

// Run training
trainFraudModel();

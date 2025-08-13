/**
 * DirectRent UK - Price Prediction Model
 * TensorFlow.js implementation for rental price prediction
 * Replaces Python scikit-learn models
 */

const tf = require('@tensorflow/tfjs');
const fs = require('fs');
const path = require('path');

class PricePredictionModel {
  /**
   * TensorFlow.js model for rental price prediction
   */
  constructor() {
    this.model = null;
    this.modelPath = path.join(process.cwd(), 'ml', 'models', 'price_model');
    this.featureNames = [];
    this.scaler = {};
  }

  /**
   * Create and train a TensorFlow.js model for price prediction
   * @param {Object} data - Training data with X features and y target
   * @param {Object} options - Training options
   * @returns {tf.History} Training history
   */
  async trainModel(data, options = {}) {
    const { X, y, featureNames } = data;
    this.featureNames = featureNames;

    // Convert to tensors
    const xs = tf.tensor2d(X);
    const ys = tf.tensor1d(y);

    // Define model architecture
    this.model = tf.sequential();
    
    // Input layer
    this.model.add(tf.layers.dense({
      inputShape: [X[0].length],
      units: 64,
      activation: 'relu'
    }));
    
    // Hidden layers
    this.model.add(tf.layers.dense({
      units: 32,
      activation: 'relu'
    }));
    
    this.model.add(tf.layers.dense({
      units: 16,
      activation: 'relu'
    }));
    
    // Output layer (regression)
    this.model.add(tf.layers.dense({
      units: 1
    }));
    
    // Compile model
    this.model.compile({
      optimizer: 'adam',
      loss: 'meanSquaredError',
      metrics: ['mse', 'mae']
    });
    
    // Set up training params with defaults
    const epochs = options.epochs || 100;
    const batchSize = options.batchSize || 32;
    const validationSplit = options.validationSplit || 0.2;
    
    // Train model
    const history = await this.model.fit(xs, ys, {
      epochs,
      batchSize,
      validationSplit,
      verbose: 1,
      callbacks: {
        onEpochEnd: (epoch, logs) => {
          if (epoch % 10 === 0) {
            console.log(`Epoch ${epoch}: loss = ${logs.loss.toFixed(4)}, val_loss = ${logs.val_loss.toFixed(4)}`);
          }
        }
      }
    });
    
    // Save model and metadata
    await this.saveModel();
    
    // Clean up tensors
    xs.dispose();
    ys.dispose();
    
    return history;
  }

  /**
   * Save the trained model and metadata
   * @returns {Promise} Promise resolving when save is complete
   */
  async saveModel() {
    if (!this.model) {
      throw new Error('No model to save');
    }

    // Create directory if it doesn't exist
    if (!fs.existsSync(this.modelPath)) {
      fs.mkdirSync(this.modelPath, { recursive: true });
    }

    // Save model
    await this.model.save(`file://${this.modelPath}`);
    
    // Save metadata
    const metadata = {
      featureNames: this.featureNames,
      scaler: this.scaler,
      created_at: new Date().toISOString(),
      version: '1.0.0'
    };
    
    fs.writeFileSync(
      path.join(this.modelPath, 'metadata.json'),
      JSON.stringify(metadata, null, 2)
    );
    
    console.log(`Model saved to ${this.modelPath}`);
    return true;
  }

  /**
   * Load a pre-trained model
   * @returns {Promise<boolean>} Success indicator
   */
  async loadModel() {
    try {
      // Check if model exists
      if (!fs.existsSync(path.join(this.modelPath, 'model.json'))) {
        console.error('Model file not found');
        return false;
      }
      
      // Load model
      this.model = await tf.loadLayersModel(`file://${this.modelPath}/model.json`);
      
      // Load metadata
      if (fs.existsSync(path.join(this.modelPath, 'metadata.json'))) {
        const metadata = JSON.parse(
          fs.readFileSync(path.join(this.modelPath, 'metadata.json'), 'utf8')
        );
        
        this.featureNames = metadata.featureNames || [];
        this.scaler = metadata.scaler || {};
      }
      
      console.log('Model loaded successfully');
      return true;
    } catch (error) {
      console.error('Error loading model:', error);
      return false;
    }
  }

  /**
   * Make a price prediction for a single property
   * @param {Object} propertyData - Property features
   * @returns {Object} Prediction with confidence interval
   */
  async predictPrice(propertyData) {
    if (!this.model) {
      const loaded = await this.loadModel();
      if (!loaded) {
        throw new Error('Failed to load price prediction model');
      }
    }
    
    // Extract features in the correct order
    const features = this.featureNames.map(name => {
      return propertyData[name] !== undefined ? 
        Number(propertyData[name]) : 0;
    });
    
    // Make prediction
    const inputTensor = tf.tensor2d([features]);
    const prediction = this.model.predict(inputTensor);
    const predictedPrice = prediction.dataSync()[0];
    
    // Cleanup tensors
    inputTensor.dispose();
    prediction.dispose();
    
    // Calculate confidence interval (using a fixed percentage as approximation)
    const confidence = 0.85;
    const variance = predictedPrice * 0.15;
    
    return {
      estimated_price: Math.round(predictedPrice),
      confidence,
      price_range: {
        min: Math.round(predictedPrice - variance),
        max: Math.round(predictedPrice + variance)
      }
    };
  }

  /**
   * Evaluate model on test data
   * @param {Object} testData - Test data with X features and y targets
   * @returns {Object} Evaluation metrics
   */
  async evaluateModel(testData) {
    if (!this.model) {
      const loaded = await this.loadModel();
      if (!loaded) {
        throw new Error('Failed to load price prediction model');
      }
    }
    
    const { X, y } = testData;
    
    // Convert to tensors
    const xs = tf.tensor2d(X);
    const ys = tf.tensor1d(y);
    
    // Evaluate model
    const evaluation = await this.model.evaluate(xs, ys);
    
    // Get metrics
    const mse = evaluation[0].dataSync()[0];
    const mae = evaluation[1].dataSync()[0];
    
    // Calculate R-squared
    const yMean = y.reduce((sum, val) => sum + val, 0) / y.length;
    const totalSS = y.reduce((sum, val) => sum + Math.pow(val - yMean, 2), 0);
    const residualSS = mse * y.length;
    const rSquared = 1 - (residualSS / totalSS);
    
    // Clean up tensors
    xs.dispose();
    ys.dispose();
    evaluation.forEach(tensor => tensor.dispose());
    
    return {
      mse,
      mae,
      rmse: Math.sqrt(mse),
      r_squared: rSquared
    };
  }
}

module.exports = {
  PricePredictionModel
};

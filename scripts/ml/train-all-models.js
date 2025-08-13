/**
 * Train All ML Models Script
 * Runs all training scripts in sequence
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Configuration
const ML_MODELS_DIR = path.join(process.cwd(), 'ml', 'models');
const DATASETS_DIR = path.join(process.cwd(), 'public', 'datasets');

// Ensure directories exist
ensureDirectoriesExist();

/**
 * Create necessary directories if they don't exist
 */
function ensureDirectoriesExist() {
  const directories = [
    ML_MODELS_DIR,
    path.join(ML_MODELS_DIR, 'price_model'),
    path.join(ML_MODELS_DIR, 'fraud_model'),
    path.join(ML_MODELS_DIR, 'recommendation'),
    DATASETS_DIR
  ];
  
  directories.forEach(dir => {
    if (!fs.existsSync(dir)) {
      console.log(`Creating directory: ${dir}`);
      fs.mkdirSync(dir, { recursive: true });
    }
  });
}

/**
 * Check if dataset exists
 */
function checkDatasetExists() {
  const datasetPath = path.join(DATASETS_DIR, 'uk_housing_rentals.csv');
  
  if (!fs.existsSync(datasetPath)) {
    console.warn(`Warning: Dataset not found at ${datasetPath}`);
    
    // Check if original dataset exists in the dataset directory
    const originalDatasetPath = path.join(process.cwd(), 'dataset', 'uk_housing_rentals.csv');
    
    if (fs.existsSync(originalDatasetPath)) {
      console.log(`Found dataset at ${originalDatasetPath}, copying to ${datasetPath}`);
      fs.copyFileSync(originalDatasetPath, datasetPath);
      console.log('Dataset copied successfully');
      return true;
    } else {
      console.error('Error: Could not find dataset. Please ensure uk_housing_rentals.csv exists in either:');
      console.error(`  - ${DATASETS_DIR}`);
      console.error(`  - ${path.join(process.cwd(), 'dataset')}`);
      return false;
    }
  }
  
  return true;
}

/**
 * Run a training script and return a promise
 */
function runTrainingScript(scriptName) {
  return new Promise((resolve, reject) => {
    console.log(`\n=========================================`);
    console.log(`Starting ${scriptName}...`);
    console.log(`=========================================\n`);
    
    const scriptPath = path.join(process.cwd(), 'scripts', 'ml', scriptName);
    const process = spawn('node', [scriptPath], { stdio: 'inherit' });
    
    process.on('close', (code) => {
      if (code === 0) {
        console.log(`\n${scriptName} completed successfully`);
        resolve();
      } else {
        console.error(`\n${scriptName} failed with code ${code}`);
        reject(new Error(`Script ${scriptName} failed with code ${code}`));
      }
    });
    
    process.on('error', (err) => {
      console.error(`Error executing ${scriptName}:`, err);
      reject(err);
    });
  });
}

/**
 * Main function to run all training scripts
 */
async function trainAllModels() {
  console.log('Starting ML model training process...');
  
  // Check if dataset exists
  if (!checkDatasetExists()) {
    process.exit(1);
  }
  
  try {
    // Train price prediction model
    await runTrainingScript('train-price-model.js');
    
    // Train fraud detection model
    await runTrainingScript('train-fraud-model.js');
    
    // Train recommendation model
    await runTrainingScript('train-recommendation-model.js');
    
    console.log('\n=========================================');
    console.log('All ML models trained successfully!');
    console.log('=========================================');
    
    // Log success details
    const modelsInfo = getModelsInfo();
    console.log('\nModels Information:');
    console.log(JSON.stringify(modelsInfo, null, 2));
    
  } catch (error) {
    console.error('Error during model training:', error);
    process.exit(1);
  }
}

/**
 * Get information about trained models
 */
function getModelsInfo() {
  const info = {
    price_model: {
      exists: fs.existsSync(path.join(ML_MODELS_DIR, 'price_model', 'model.json')),
      last_trained: null,
      metrics: null
    },
    fraud_model: {
      exists: fs.existsSync(path.join(ML_MODELS_DIR, 'fraud_model', 'model.json')),
      last_trained: null,
      metrics: null
    },
    recommendation_model: {
      exists: fs.existsSync(path.join(ML_MODELS_DIR, 'recommendation', 'model.json')),
      last_trained: null,
      metrics: null
    }
  };
  
  // Get last trained time and metrics if available
  const modelsWithEval = [
    { key: 'price_model', path: path.join(ML_MODELS_DIR, 'price_model', 'evaluation.json') },
    { key: 'fraud_model', path: path.join(ML_MODELS_DIR, 'fraud_model', 'evaluation.json') },
    { key: 'recommendation_model', path: path.join(ML_MODELS_DIR, 'recommendation', 'evaluation.json') }
  ];
  
  modelsWithEval.forEach(model => {
    if (fs.existsSync(model.path)) {
      try {
        const evalData = JSON.parse(fs.readFileSync(model.path, 'utf8'));
        info[model.key].last_trained = evalData.timestamp || evalData.trained_at || 'unknown';
        info[model.key].metrics = evalData;
      } catch (e) {
        console.warn(`Could not parse evaluation data for ${model.key}`);
      }
    }
  });
  
  return info;
}

// Run the training process
trainAllModels();

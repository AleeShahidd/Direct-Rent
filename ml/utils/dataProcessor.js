/**
 * DirectRent UK - Data Processing Module
 * Handles UK housing dataset processing and feature engineering
 * JavaScript implementation replacing Python data_processor.py
 */

const fs = require('fs');
const path = require('path');
const Papa = require('papaparse');
const { Matrix } = require('ml-matrix');

class UKHousingDataProcessor {
  /**
   * Processes UK housing rental data for ML model training and inference
   */
  constructor(datasetPath = path.join(process.cwd(), 'public', 'datasets', 'uk_housing_rentals.csv')) {
    this.datasetPath = datasetPath;
    this.data = null;
    this.processedData = null;
    this.labelEncoders = {};
    this.scalers = {};
  }

  /**
   * Load and perform initial data cleaning
   * @returns {Array} Parsed dataset
   */
  async loadDataset() {
    try {
      // Check if file exists
      if (!fs.existsSync(this.datasetPath)) {
        console.error(`Dataset not found at: ${this.datasetPath}`);
        return this._createMockDataset();
      }

      // Read and parse CSV file
      const fileContent = fs.readFileSync(this.datasetPath, 'utf8');
      const result = Papa.parse(fileContent, {
        header: true,
        skipEmptyLines: true,
        dynamicTyping: true,
        delimiter: ',', // Explicitly set delimiter
        quoteChar: '"', // Explicitly set quote character
        error: (error) => {
          console.error('Error parsing CSV:', error.message);
        }
      });

      if (result.errors && result.errors.length > 0) {
        console.warn('Warning while parsing CSV:', result.errors);
      }

      this.data = result.data;
      
      // Check if we have valid data
      if (!this.data || this.data.length === 0 || !this.data[0]) {
        console.warn('No valid data parsed from CSV, using mock data instead');
        return this._createMockDataset();
      }
      
      console.log(`Loaded dataset with ${this.data.length} records`);
      
      return this.data;
    } catch (error) {
      console.error(`Error loading dataset: ${error.message}`);
      // Return mock data if dataset not available
      return this._createMockDataset();
    }
  }

  /**
   * Create mock UK housing data for development
   * @returns {Array} Mock dataset
   */
  _createMockDataset() {
    console.log('Creating mock dataset');
    const nSamples = 10000;
    
    // UK cities and postcodes
    const ukCities = ['London', 'Manchester', 'Birmingham', 'Leeds', 'Liverpool', 
                    'Bristol', 'Edinburgh', 'Glasgow', 'Sheffield', 'Newcastle'];
    
    const postcodePrefix = ['SW', 'W', 'E', 'N', 'S', 'M', 'B', 'L', 'LS', 'NE'];
    const propertyTypes = ['Flat', 'House', 'Studio', 'Bungalow', 'Maisonette'];
    const furnishingStatus = ['Furnished', 'Unfurnished', 'Part-Furnished'];
    const epcRatings = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];
    const councilTaxBands = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
    
    const mockData = [];
    
    for (let i = 0; i < nSamples; i++) {
      // Random selection helpers
      const randomItem = arr => arr[Math.floor(Math.random() * arr.length)];
      const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
      const randomFloat = (min, max) => Math.random() * (max - min) + min;
      const randomBool = () => Math.random() > 0.5;
      
      // Generate random postcode
      const postcode = `${randomItem(postcodePrefix)}${randomInt(1,20)} ${randomInt(1,9)}${String.fromCharCode(65 + randomInt(0,25))}${String.fromCharCode(65 + randomInt(0,25))}`;
      
      // Generate random price with normal distribution
      const price = Math.min(Math.max(300, randomFloat(1000, 2000) + randomFloat(-800, 800)), 8000);
      
      mockData.push({
        property_id: `prop_${i.toString().padStart(6, '0')}`,
        title: `Property ${i}`,
        city: randomItem(ukCities),
        postcode: postcode,
        property_type: randomItem(propertyTypes),
        bedrooms: randomInt(1, 5),
        bathrooms: randomInt(1, 3),
        price_per_month: Math.round(price),
        furnishing_status: randomItem(furnishingStatus),
        epc_rating: randomItem(epcRatings),
        council_tax_band: randomItem(councilTaxBands),
        parking: randomBool(),
        garden: randomBool(),
        pets_allowed: randomBool(),
        latitude: randomFloat(50.0, 58.0),
        longitude: randomFloat(-5.0, 2.0),
        created_at: new Date(2020, 0, 1 + i).toISOString(),
        view_count: Math.floor(Math.random() * 100),
        landlord_rating: randomFloat(1, 5)
      });
    }
    
    return mockData;
  }

  /**
   * Clean and preprocess the dataset
   * @returns {Array} Cleaned data
   */
  cleanData() {
    if (!this.data || this.data.length === 0) {
      console.warn('No data to clean. Using mock data instead.');
      this.data = this._createMockDataset();
    }
    
    const df = [...this.data];
    
    // Handle missing values for numeric columns
    const numericColumns = ['bedrooms', 'bathrooms', 'price_per_month', 'latitude', 'longitude'];
    
    numericColumns.forEach(column => {
      // Calculate median for the column
      const validValues = df
        .map(row => row[column])
        .filter(val => val !== null && val !== undefined && !isNaN(val));
      
      const median = this._calculateMedian(validValues);
      
      // Fill missing values with median
      df.forEach(row => {
        if (row[column] === null || row[column] === undefined || isNaN(row[column])) {
          row[column] = median;
        }
      });
    });
    
    // Handle missing values for categorical columns
    const categoricalColumns = ['property_type', 'furnishing_status', 'city', 'postcode'];
    
    categoricalColumns.forEach(column => {
      // Find most common value (mode)
      const valueCounts = {};
      df.forEach(row => {
        if (row[column]) {
          valueCounts[row[column]] = (valueCounts[row[column]] || 0) + 1;
        }
      });
      
      // Get mode (most frequent value)
      let mode = null;
      let maxCount = 0;
      
      Object.entries(valueCounts).forEach(([value, count]) => {
        if (count > maxCount) {
          maxCount = count;
          mode = value;
        }
      });
      
      // Fill missing values with mode
      df.forEach(row => {
        if (!row[column]) {
          row[column] = mode;
        }
      });
    });
    
    // Clean price data
    const cleanedData = df
      .filter(row => {
        const price = parseFloat(row.price_per_month);
        return !isNaN(price) && price > 0 && price < 20000;
      })
      .map(row => {
        // Ensure each row has an ID
        if (!row.id && !row.property_id) {
          row.id = `prop_${Math.random().toString(36).substring(2, 10)}`;
        }
        
        // Clean postcode format
        if (row.postcode) {
          row.postcode = String(row.postcode).toUpperCase().trim();
          row.postcode_area = row.postcode.match(/^([A-Z]{1,2})/)?.[1] || '';
        }
        
        // Standardize property types
        if (row.property_type) {
          const propertyTypeMapping = {
            'apartment': 'Flat', 
            'flat': 'Flat', 
            'maisonette': 'Maisonette',
            'house': 'House', 
            'bungalow': 'Bungalow', 
            'studio': 'Studio'
          };
          
          const lowerCaseType = String(row.property_type).toLowerCase();
          row.property_type = propertyTypeMapping[lowerCaseType] || row.property_type;
        }
        
        return row;
      });
    
    return cleanedData.length > 0 ? cleanedData : this._createMockDataset();
  }

  /**
   * Create additional features for ML models
   * @param {Array} data - Cleaned dataset
   * @returns {Array} Enhanced dataset with engineered features
   */
  featureEngineering(data) {
    return data.map(row => {
      const enhanced = { ...row };
      
      // Price per bedroom
      if (row.bedrooms && row.price_per_month) {
        enhanced.price_per_bedroom = row.price_per_month / Math.max(1, row.bedrooms);
      }
      
      // Property age (if available)
      if (row.created_at) {
        const createdDate = new Date(row.created_at);
        const now = new Date();
        const diffTime = Math.abs(now - createdDate);
        enhanced.days_since_listed = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      }
      
      // Location-based features (city price ranking)
      // Will be calculated in a separate step after processing all rows
      
      // Amenity score
      const amenityColumns = ['parking', 'garden', 'pets_allowed'];
      let amenityScore = 0;
      
      amenityColumns.forEach(col => {
        if (row[col] === true) {
          amenityScore += 1;
        }
      });
      
      enhanced.amenity_score = amenityScore;
      
      // EPC rating numeric
      if (row.epc_rating) {
        const epcMapping = { 'A': 7, 'B': 6, 'C': 5, 'D': 4, 'E': 3, 'F': 2, 'G': 1 };
        enhanced.epc_numeric = epcMapping[row.epc_rating] || 0;
      }
      
      // Council tax band numeric
      if (row.council_tax_band) {
        const taxMapping = { 'A': 1, 'B': 2, 'C': 3, 'D': 4, 'E': 5, 'F': 6, 'G': 7, 'H': 8 };
        enhanced.council_tax_numeric = taxMapping[row.council_tax_band] || 0;
      }
      
      return enhanced;
    });
  }

  /**
   * Add city price ranking feature
   * @param {Array} data - Dataset with features
   * @returns {Array} Dataset with city price rankings
   */
  addCityPriceRanking(data) {
    // Calculate median prices by city
    const cityPrices = {};
    
    data.forEach(row => {
      if (row.city && row.price_per_month) {
        if (!cityPrices[row.city]) {
          cityPrices[row.city] = [];
        }
        cityPrices[row.city].push(row.price_per_month);
      }
    });
    
    // Calculate median for each city
    const cityMedians = {};
    
    Object.entries(cityPrices).forEach(([city, prices]) => {
      cityMedians[city] = this._calculateMedian(prices);
    });
    
    // Sort cities by median price (descending)
    const rankedCities = Object.entries(cityMedians)
      .sort((a, b) => b[1] - a[1])
      .map(([city], index) => ({ city, rank: index + 1 }));
    
    // Create ranking lookup
    const cityRanking = {};
    rankedCities.forEach(item => {
      cityRanking[item.city] = item.rank;
    });
    
    // Add ranking to data
    return data.map(row => {
      const enhanced = { ...row };
      enhanced.city_price_rank = cityRanking[row.city] || 0;
      return enhanced;
    });
  }

  /**
   * Encode categorical variables for ML models
   * @param {Array} data - Dataset with features
   * @returns {Array} Dataset with encoded categorical features
   */
  encodeCategoricalFeatures(data) {
    const categoricalColumns = ['city', 'property_type', 'furnishing_status', 'postcode_area'];
    
    categoricalColumns.forEach(column => {
      if (!data[0] || !(column in data[0])) {
        return; // Skip if column doesn't exist
      }
      
      // Create label encoder
      if (!this.labelEncoders[column]) {
        // Get unique values
        const uniqueValues = [...new Set(data.map(row => String(row[column] || '')))];
        
        // Create encoder mapping
        const encoder = {};
        uniqueValues.forEach((value, index) => {
          encoder[value] = index;
        });
        
        // Store encoder and its reverse mapping
        this.labelEncoders[column] = {
          encode: encoder,
          decode: Object.fromEntries(Object.entries(encoder).map(([k, v]) => [v, k])),
          classes: uniqueValues
        };
      }
      
      // Apply encoding
      data.forEach(row => {
        const value = String(row[column] || '');
        const encoded = this.labelEncoders[column].encode[value];
        
        // Handle unknown categories
        if (encoded === undefined) {
          // Use 'unknown' code if available, otherwise use last index
          if ('unknown' in this.labelEncoders[column].encode) {
            row[`${column}_encoded`] = this.labelEncoders[column].encode['unknown'];
          } else {
            // Add 'unknown' class
            const unknownIndex = this.labelEncoders[column].classes.length;
            this.labelEncoders[column].classes.push('unknown');
            this.labelEncoders[column].encode['unknown'] = unknownIndex;
            this.labelEncoders[column].decode[unknownIndex] = 'unknown';
            row[`${column}_encoded`] = unknownIndex;
          }
        } else {
          row[`${column}_encoded`] = encoded;
        }
      });
    });
    
    return data;
  }
  
  /**
   * Scale numeric features for ML models
   * @param {Array} data - Dataset with features
   * @param {Array} columns - Numeric columns to scale
   * @returns {Array} Dataset with scaled features
   */
  scaleFeatures(data, columns = ['bedrooms', 'bathrooms', 'price_per_month', 'price_per_bedroom']) {
    columns.forEach(column => {
      if (!data[0] || !(column in data[0])) {
        return; // Skip if column doesn't exist
      }
      
      // Extract values for the column
      const values = data.map(row => parseFloat(row[column] || 0)).filter(v => !isNaN(v));
      
      // Calculate mean and std
      const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
      const std = Math.sqrt(
        values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length
      );
      
      // Store scaler
      this.scalers[column] = { mean, std };
      
      // Apply scaling
      data.forEach(row => {
        if (row[column] !== undefined && row[column] !== null) {
          row[`${column}_scaled`] = (parseFloat(row[column]) - mean) / (std || 1);
        } else {
          row[`${column}_scaled`] = 0; // Default for missing values
        }
      });
    });
    
    return data;
  }

  /**
   * Prepare features and target for ML models
   * @param {Array} data - Processed dataset
   * @param {string} targetColumn - Target variable column name
   * @returns {Object} Features X and target y
   */
  prepareFeaturesForML(data, targetColumn = 'price_per_month') {
    // Select feature columns
    const featureColumns = [
      'bedrooms', 'bathrooms', 'city_encoded', 'property_type_encoded',
      'furnishing_status_encoded', 'epc_numeric', 'council_tax_numeric',
      'amenity_score', 'price_per_bedroom', 'city_price_rank'
    ];
    
    // Filter available columns
    const availableFeatures = featureColumns.filter(col => 
      data[0] && (col in data[0])
    );
    
    // Extract features and target
    const X = data.map(row => {
      return availableFeatures.map(col => {
        const val = row[col];
        return val === null || val === undefined || isNaN(val) ? 0 : Number(val);
      });
    });
    
    // Extract target if available
    const y = targetColumn in data[0] 
      ? data.map(row => Number(row[targetColumn] || 0))
      : null;
    
    return { X, y, featureNames: availableFeatures };
  }

  /**
   * Get filtered data for property recommendations
   * @param {Object} userPreferences - User preferences
   * @returns {Array} Filtered dataset
   */
  getPropertyRecommendationsData(userPreferences) {
    if (!this.processedData) {
      throw new Error('No processed data available. Process dataset first.');
    }
    
    let filtered = [...this.processedData];
    
    // Apply user preferences
    if (userPreferences.price_min) {
      filtered = filtered.filter(row => 
        row.price_per_month >= userPreferences.price_min
      );
    }
    
    if (userPreferences.price_max) {
      filtered = filtered.filter(row => 
        row.price_per_month <= userPreferences.price_max
      );
    }
    
    if (userPreferences.property_type) {
      filtered = filtered.filter(row => 
        row.property_type === userPreferences.property_type
      );
    }
    
    if (userPreferences.min_bedrooms) {
      filtered = filtered.filter(row => 
        row.bedrooms >= userPreferences.min_bedrooms
      );
    }
    
    if (userPreferences.city) {
      filtered = filtered.filter(row => 
        row.city && row.city.toLowerCase().includes(userPreferences.city.toLowerCase())
      );
    }
    
    return filtered.slice(0, 100); // Limit results for performance
  }

  /**
   * Complete data processing pipeline
   * @returns {Array} Processed dataset
   */
  async processFullDataset() {
    try {
      // Load data
      const rawData = await this.loadDataset();
      
      // Clean data
      const cleanedData = this.cleanData();
      
      // Check if we have data after cleaning
      if (!cleanedData || cleanedData.length === 0) {
        console.warn('No data after cleaning. Using mock dataset.');
        this.processedData = this._createMockDataset();
        return this.processedData;
      }
      
      // Feature engineering
      let featuredData = this.featureEngineering(cleanedData);
      
      // Add city price ranking
      featuredData = this.addCityPriceRanking(featuredData);
      
      // Encode categorical variables
      const encodedData = this.encodeCategoricalFeatures(featuredData);
      
      // Scale numeric features
      this.processedData = this.scaleFeatures(encodedData);
      
      // Final check to ensure we have processed data
      if (!this.processedData || this.processedData.length === 0) {
        console.warn('No processed data generated. Using mock dataset.');
        this.processedData = this._createMockDataset();
      }
      
      console.log(`Processed dataset with ${this.processedData.length} records`);
      
      if (this.processedData.length > 0) {
        console.log(`Available features: ${Object.keys(this.processedData[0] || {}).join(', ')}`);
      }
      
      return this.processedData;
    } catch (error) {
      console.error('Error processing dataset:', error);
      console.warn('Using mock dataset instead.');
      this.processedData = this._createMockDataset();
      return this.processedData;
    }
  }

  /**
   * Get market statistics for price estimation
   * @param {string} city - City filter
   * @param {string} propertyType - Property type filter
   * @returns {Object} Market statistics
   */
  getMarketStatistics(city = null, propertyType = null) {
    if (!this.processedData) {
      throw new Error('No processed data available. Process dataset first.');
    }
    
    let filtered = [...this.processedData];
    
    // Filter by city and property type if provided
    if (city) {
      filtered = filtered.filter(row => 
        row.city && row.city.toLowerCase().includes(city.toLowerCase())
      );
    }
    
    if (propertyType) {
      filtered = filtered.filter(row => row.property_type === propertyType);
    }
    
    if (filtered.length === 0) {
      return this._getDefaultMarketStats();
    }
    
    // Calculate statistics
    const prices = filtered.map(row => row.price_per_month).filter(p => !isNaN(p));
    const bedrooms = filtered.map(row => row.bedrooms).filter(b => !isNaN(b));
    const bathrooms = filtered.map(row => row.bathrooms).filter(b => !isNaN(b));
    
    const stats = {
      average_price: this._calculateMean(prices),
      median_price: this._calculateMedian(prices),
      min_price: Math.min(...prices),
      max_price: Math.max(...prices),
      std_price: this._calculateStandardDeviation(prices),
      total_properties: filtered.length,
      avg_bedrooms: this._calculateMean(bedrooms),
      avg_bathrooms: this._calculateMean(bathrooms),
    };
    
    return stats;
  }

  /**
   * Default market statistics when no data available
   * @returns {Object} Default statistics
   */
  _getDefaultMarketStats() {
    return {
      average_price: 1500.0,
      median_price: 1400.0,
      min_price: 500.0,
      max_price: 5000.0,
      std_price: 800.0,
      total_properties: 0,
      avg_bedrooms: 2.5,
      avg_bathrooms: 1.5,
    };
  }

  /**
   * Detect price anomalies for fraud detection
   * @param {Object} propertyData - Property data
   * @returns {Object} Anomaly detection results
   */
  detectPriceAnomalies(propertyData) {
    const city = propertyData.city || '';
    const propertyType = propertyData.property_type || '';
    const price = parseFloat(propertyData.price_per_month) || 0;
    
    const marketStats = this.getMarketStatistics(city, propertyType);
    
    // Calculate z-score
    const zScore = Math.abs(price - marketStats.average_price) / (marketStats.std_price || 1);
    
    // Determine anomaly level
    let anomalyLevel = 'normal';
    if (zScore > 3) {
      anomalyLevel = 'high';
    } else if (zScore > 2) {
      anomalyLevel = 'medium';
    } else if (zScore > 1) {
      anomalyLevel = 'low';
    }
    
    return {
      z_score: zScore,
      anomaly_level: anomalyLevel,
      market_average: marketStats.average_price,
      price_deviation_percent: Math.abs(price - marketStats.average_price) / marketStats.average_price * 100
    };
  }

  /**
   * Calculate mean of an array
   * @param {Array} arr - Numeric array
   * @returns {number} Mean value
   */
  _calculateMean(arr) {
    if (!arr || arr.length === 0) return 0;
    return arr.reduce((sum, val) => sum + val, 0) / arr.length;
  }

  /**
   * Calculate median of an array
   * @param {Array} arr - Numeric array
   * @returns {number} Median value
   */
  _calculateMedian(arr) {
    if (!arr || arr.length === 0) return 0;
    
    const sorted = [...arr].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    
    return sorted.length % 2 === 0
      ? (sorted[mid - 1] + sorted[mid]) / 2
      : sorted[mid];
  }

  /**
   * Calculate standard deviation of an array
   * @param {Array} arr - Numeric array
   * @returns {number} Standard deviation
   */
  _calculateStandardDeviation(arr) {
    if (!arr || arr.length === 0) return 0;
    
    const mean = this._calculateMean(arr);
    const variance = arr.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / arr.length;
    
    return Math.sqrt(variance);
  }
}

// Exporting the data processor
module.exports = {
  UKHousingDataProcessor
};

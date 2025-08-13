/**
 * DirectRent UK - ML Health API
 * Provides health status of all ML models
 */

import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';

export async function GET() {
  try {
    // Check all ML models health
    const modelsBasePath = path.join(process.cwd(), 'ml', 'models');
    
    // Initialize health status
    const modelHealth = {
      price_model: { status: 'not_found', metrics: null },
      fraud_model: { status: 'not_found', metrics: null },
      recommendation: { status: 'not_found', metrics: null }
    };
    
    // Check price model
    const priceModelPath = path.join(modelsBasePath, 'price_model', 'model.json');
    if (fs.existsSync(priceModelPath)) {
      modelHealth.price_model.status = 'active';
      
      // Get evaluation metrics if available
      const evalPath = path.join(modelsBasePath, 'price_model', 'evaluation.json');
      if (fs.existsSync(evalPath)) {
        try {
          modelHealth.price_model.metrics = JSON.parse(fs.readFileSync(evalPath, 'utf8'));
        } catch (e) {
          console.warn('Error parsing price model evaluation:', e);
        }
      }
    }
    
    // Check fraud model
    const fraudModelPath = path.join(modelsBasePath, 'fraud_model.json');
    if (fs.existsSync(fraudModelPath)) {
      modelHealth.fraud_model.status = 'active';
      
      // Get evaluation metrics if available
      const evalPath = path.join(path.dirname(fraudModelPath), 'fraud_model_evaluation.json');
      if (fs.existsSync(evalPath)) {
        try {
          modelHealth.fraud_model.metrics = JSON.parse(fs.readFileSync(evalPath, 'utf8'));
        } catch (e) {
          console.warn('Error parsing fraud model evaluation:', e);
        }
      }
    }
    
    // Check recommendation models
    const collabModelPath = path.join(modelsBasePath, 'recommendation', 'collaborative_model.json');
    const contentModelPath = path.join(modelsBasePath, 'recommendation', 'content_model.json');
    
    if (fs.existsSync(collabModelPath) && fs.existsSync(contentModelPath)) {
      modelHealth.recommendation.status = 'active';
    } else if (fs.existsSync(collabModelPath) || fs.existsSync(contentModelPath)) {
      modelHealth.recommendation.status = 'partial';
    }
    
    // Calculate overall health
    const statusCounts = Object.values(modelHealth)
      .reduce((counts, model) => {
        counts[model.status] = (counts[model.status] || 0) + 1;
        return counts;
      }, {});
    
    const totalModels = Object.keys(modelHealth).length;
    const activeCount = statusCounts.active || 0;
    const partialCount = statusCounts.partial || 0;
    
    let overallStatus = 'healthy';
    if (activeCount === 0) {
      overallStatus = 'critical';
    } else if (activeCount < totalModels / 2) {
      overallStatus = 'degraded';
    } else if (activeCount < totalModels) {
      overallStatus = 'warning';
    }
    
    return NextResponse.json({
      status: overallStatus,
      models: modelHealth,
      healthy_ratio: `${activeCount + (partialCount * 0.5)}/${totalModels}`,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error checking ML health:', error);
    return NextResponse.json(
      { 
        error: 'Failed to check ML health status',
        details: error.message,
        status: 'error'
      },
      { status: 500 }
    );
  }
}

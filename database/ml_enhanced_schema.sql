-- Enhanced fraud detection table for ML integration
-- This schema supports both manual fraud reports and automated ML fraud detection

-- Create fraud_reports table if it doesn't exist
CREATE TABLE IF NOT EXISTS fraud_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
  landlord_id UUID REFERENCES users(id) ON DELETE CASCADE,
  
  -- ML Detection Fields
  fraud_score DECIMAL(3,2) DEFAULT 0.00, -- Score between 0.00 and 1.00
  is_fraudulent BOOLEAN DEFAULT false,
  reasons TEXT[], -- Array of reasons for fraud detection
  risk_factors JSONB DEFAULT '{}', -- Detailed risk factor scores
  
  -- Traditional Report Fields
  reported_by UUID REFERENCES users(id), -- User who reported (optional for ML reports)
  report_type VARCHAR(50) DEFAULT 'ml_detection', -- 'ml_detection', 'user_report', 'admin_review'
  description TEXT,
  evidence_urls TEXT[],
  
  -- Review and Status
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'approved', 'rejected')),
  priority VARCHAR(10) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  assigned_to UUID REFERENCES users(id), -- Admin assigned to review
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewed_by UUID REFERENCES users(id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_fraud_reports_property_id ON fraud_reports(property_id);
CREATE INDEX IF NOT EXISTS idx_fraud_reports_landlord_id ON fraud_reports(landlord_id);
CREATE INDEX IF NOT EXISTS idx_fraud_reports_status ON fraud_reports(status);
CREATE INDEX IF NOT EXISTS idx_fraud_reports_fraud_score ON fraud_reports(fraud_score);
CREATE INDEX IF NOT EXISTS idx_fraud_reports_created_at ON fraud_reports(created_at);

-- Create or update the properties table to include status and admin notes
ALTER TABLE properties 
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'pending_approval', 'suspended', 'rejected')),
ADD COLUMN IF NOT EXISTS admin_notes TEXT;

-- Create ML model metrics table for monitoring
CREATE TABLE IF NOT EXISTS ml_model_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  model_name VARCHAR(100) NOT NULL,
  metric_type VARCHAR(50) NOT NULL, -- 'accuracy', 'precision', 'recall', 'f1_score', 'latency', 'error_rate'
  metric_value DECIMAL(10,6) NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'
);

-- Create indexes for ML metrics
CREATE INDEX IF NOT EXISTS idx_ml_model_metrics_model_name ON ml_model_metrics(model_name);
CREATE INDEX IF NOT EXISTS idx_ml_model_metrics_timestamp ON ml_model_metrics(timestamp);
CREATE INDEX IF NOT EXISTS idx_ml_model_metrics_type ON ml_model_metrics(metric_type);

-- Create user preferences table for recommendations
CREATE TABLE IF NOT EXISTS user_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  preferences JSONB DEFAULT '{}', -- Store user preferences for recommendations
  search_history JSONB DEFAULT '[]', -- Store recent searches for better recommendations
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Create property interactions table for recommendation engine
CREATE TABLE IF NOT EXISTS property_interactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
  interaction_type VARCHAR(20) NOT NULL, -- 'view', 'save', 'inquiry', 'contact'
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for property interactions
CREATE INDEX IF NOT EXISTS idx_property_interactions_user_id ON property_interactions(user_id);
CREATE INDEX IF NOT EXISTS idx_property_interactions_property_id ON property_interactions(property_id);
CREATE INDEX IF NOT EXISTS idx_property_interactions_type ON property_interactions(interaction_type);
CREATE INDEX IF NOT EXISTS idx_property_interactions_created_at ON property_interactions(created_at);

-- Add RLS (Row Level Security) policies for fraud reports
ALTER TABLE fraud_reports ENABLE ROW LEVEL SECURITY;

-- Policy: Admin users can see all fraud reports
CREATE POLICY "Admin can view all fraud reports" ON fraud_reports
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Policy: Landlords can see their own property fraud reports
CREATE POLICY "Landlords can view their property fraud reports" ON fraud_reports
  FOR SELECT
  USING (
    landlord_id = auth.uid()
  );

-- Policy: Only admins can insert fraud reports
CREATE POLICY "Admin can insert fraud reports" ON fraud_reports
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Policy: Only admins can update fraud reports
CREATE POLICY "Admin can update fraud reports" ON fraud_reports
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers to automatically update updated_at
CREATE TRIGGER update_fraud_reports_updated_at 
  BEFORE UPDATE ON fraud_reports 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_preferences_updated_at 
  BEFORE UPDATE ON user_preferences 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert some sample data for testing (optional)
-- This would be replaced with real data in production
INSERT INTO ml_model_metrics (model_name, metric_type, metric_value, metadata) VALUES
  ('price_prediction', 'accuracy', 0.94, '{"dataset": "uk_housing_2024", "samples": 10000}'),
  ('price_prediction', 'mae', 0.039, '{"dataset": "uk_housing_2024", "samples": 10000}'),
  ('fraud_detection', 'accuracy', 0.96, '{"dataset": "fraud_samples_2024", "samples": 5000}'),
  ('fraud_detection', 'precision', 0.94, '{"dataset": "fraud_samples_2024", "samples": 5000}'),
  ('recommendation', 'precision_at_10', 0.74, '{"dataset": "user_interactions_2024", "samples": 15000}')
ON CONFLICT DO NOTHING;

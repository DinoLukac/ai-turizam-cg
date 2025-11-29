-- Users table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User locations table (stores user's current location)
CREATE TABLE IF NOT EXISTS user_locations (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  accuracy DECIMAL(10, 2),
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- POI (Points of Interest) table
CREATE TABLE IF NOT EXISTS poi (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  category VARCHAR(100), -- 'cultural', 'restaurant', 'monument', 'nature', etc.
  google_place_id VARCHAR(255) UNIQUE,
  rating DECIMAL(3, 2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Daily plans table
CREATE TABLE IF NOT EXISTS daily_plans (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  start_location_lat DECIMAL(10, 8),
  start_location_lng DECIMAL(11, 8),
  plan_data JSONB, -- Stores the AI-generated plan
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Plan POI associations
CREATE TABLE IF NOT EXISTS plan_poi (
  id SERIAL PRIMARY KEY,
  plan_id INTEGER REFERENCES daily_plans(id) ON DELETE CASCADE,
  poi_id INTEGER REFERENCES poi(id) ON DELETE CASCADE,
  order_index INTEGER NOT NULL,
  visit_duration INTEGER, -- minutes
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- AI generated content (stories, descriptions, etc.)
CREATE TABLE IF NOT EXISTS ai_content (
  id SERIAL PRIMARY KEY,
  poi_id INTEGER REFERENCES poi(id) ON DELETE CASCADE,
  content_type VARCHAR(50), -- 'story', 'description', 'guide'
  content TEXT NOT NULL,
  generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_locations_user_id ON user_locations(user_id);
CREATE INDEX IF NOT EXISTS idx_user_locations_timestamp ON user_locations(timestamp);
CREATE INDEX IF NOT EXISTS idx_poi_location ON poi(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_poi_category ON poi(category);
CREATE INDEX IF NOT EXISTS idx_daily_plans_user_date ON daily_plans(user_id, date);
CREATE INDEX IF NOT EXISTS idx_plan_poi_plan_id ON plan_poi(plan_id);


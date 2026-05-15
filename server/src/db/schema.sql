-- KosovaIntel Database Schema

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(255),
  company_name VARCHAR(255),
  role VARCHAR(20) DEFAULT 'client',
  phone VARCHAR(50),
  country VARCHAR(100) DEFAULT 'Kosovo',
  use_case VARCHAR(100),
  verified BOOLEAN DEFAULT FALSE,
  verification_token VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS companies (
  id SERIAL PRIMARY KEY,
  arbk_id VARCHAR(50) UNIQUE,
  registration_number VARCHAR(50) UNIQUE,
  name VARCHAR(255) NOT NULL,
  name_normalized VARCHAR(255),
  legal_form VARCHAR(100),
  status VARCHAR(50),
  registration_date DATE,
  deregistration_date DATE,
  municipality VARCHAR(100),
  address TEXT,
  primary_activity_code VARCHAR(20),
  primary_activity_description TEXT,
  share_capital_eur DECIMAL(15,2),
  employee_range VARCHAR(20),
  source_url TEXT,
  scraped_at TIMESTAMPTZ,
  last_updated TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_companies_name_normalized ON companies(name_normalized);
CREATE INDEX IF NOT EXISTS idx_companies_municipality ON companies(municipality);
CREATE INDEX IF NOT EXISTS idx_companies_status ON companies(status);

CREATE TABLE IF NOT EXISTS company_persons (
  id SERIAL PRIMARY KEY,
  company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
  full_name VARCHAR(255),
  role VARCHAR(100),
  ownership_percent DECIMAL(5,2),
  person_type VARCHAR(50),
  nationality VARCHAR(100),
  id_number_hash VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS procurement_records (
  id SERIAL PRIMARY KEY,
  company_id INTEGER REFERENCES companies(id),
  company_name_raw VARCHAR(255),
  ocid VARCHAR(255) UNIQUE,
  tender_title TEXT,
  contracting_authority VARCHAR(255),
  municipality VARCHAR(100),
  contract_value_eur DECIMAL(15,2),
  award_date DATE,
  procedure_type VARCHAR(100),
  cpv_code VARCHAR(50),
  cpv_description TEXT,
  source_url TEXT,
  scraped_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_procurement_company ON procurement_records(company_id);

CREATE TABLE IF NOT EXISTS news_mentions (
  id SERIAL PRIMARY KEY,
  company_id INTEGER REFERENCES companies(id),
  search_term VARCHAR(255),
  headline TEXT,
  summary TEXT,
  source_name VARCHAR(100),
  source_url TEXT,
  published_at DATE,
  sentiment VARCHAR(20),
  scraped_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_news_company ON news_mentions(company_id);

CREATE TABLE IF NOT EXISTS property_records (
  id SERIAL PRIMARY KEY,
  person_name VARCHAR(255),
  company_id INTEGER REFERENCES companies(id),
  property_type VARCHAR(100),
  municipality VARCHAR(100),
  cadastral_zone VARCHAR(100),
  source_url TEXT,
  scraped_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS report_orders (
  id SERIAL PRIMARY KEY,
  order_number VARCHAR(20) UNIQUE,
  client_id INTEGER REFERENCES users(id),
  company_id INTEGER REFERENCES companies(id),
  target_company_name VARCHAR(255),
  report_type VARCHAR(50),
  status VARCHAR(50) DEFAULT 'pending',
  urgency VARCHAR(20) DEFAULT 'standard',
  price_eur DECIMAL(10,2),
  paid BOOLEAN DEFAULT FALSE,
  paid_at TIMESTAMPTZ,
  payment_method VARCHAR(50),
  assigned_analyst_id INTEGER REFERENCES users(id),
  client_notes TEXT,
  internal_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  due_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_orders_client ON report_orders(client_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON report_orders(status);

CREATE TABLE IF NOT EXISTS reports (
  id SERIAL PRIMARY KEY,
  order_id INTEGER REFERENCES report_orders(id) UNIQUE,
  company_id INTEGER REFERENCES companies(id),
  version INTEGER DEFAULT 1,
  company_overview JSONB,
  ownership_structure JSONB,
  financial_indicators JSONB,
  procurement_history JSONB,
  news_analysis JSONB,
  property_assets JSONB,
  legal_flags JSONB,
  analyst_summary TEXT,
  analyst_risk_rating VARCHAR(20),
  analyst_flags JSONB,
  analyst_recommendations TEXT,
  ai_risk_narrative TEXT,
  ai_risk_score INTEGER,
  pdf_path TEXT,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS scrape_jobs (
  id SERIAL PRIMARY KEY,
  job_type VARCHAR(100),
  target VARCHAR(255),
  status VARCHAR(50),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  records_processed INTEGER DEFAULT 0,
  error_message TEXT,
  triggered_by VARCHAR(50)
);

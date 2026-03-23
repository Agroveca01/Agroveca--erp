/*
  # Customer Loyalty & CRM Module

  ## Overview
  This migration creates a comprehensive Customer Loyalty and CRM system for Cuida Tu Planta.

  ## 1. New Tables
    - `customers`
      - `id` (uuid, primary key)
      - `name` (text) - Customer full name
      - `email` (text, unique) - Customer email
      - `phone` (text) - Customer phone number
      - `address` (text) - Shipping address
      - `total_purchases` (integer) - Total number of purchases
      - `total_spent` (decimal) - Lifetime value (LTV)
      - `loyalty_tier` (integer) - Tier level (1, 2, or 3 leaves)
      - `reward_count` (integer) - Number of rewards earned
      - `last_purchase_date` (date) - Date of last purchase
      - `created_at` (timestamptz) - Account creation date
      - `updated_at` (timestamptz) - Last update timestamp

    - `customer_orders`
      - `id` (uuid, primary key)
      - `customer_id` (uuid, foreign key) - Reference to customers table
      - `order_number` (text, unique) - Order tracking number
      - `order_date` (date) - Date of order
      - `total_amount` (decimal) - Order total
      - `items` (jsonb) - Order items details
      - `status` (text) - Order status (pending, shipped, delivered, cancelled)
      - `reward_eligible` (boolean) - Whether this is the 10th purchase
      - `reward_included` (boolean) - Whether reward was included
      - `created_at` (timestamptz)

    - `loyalty_rewards`
      - `id` (uuid, primary key)
      - `customer_id` (uuid, foreign key)
      - `order_id` (uuid, foreign key)
      - `reward_type` (text) - Type of reward (10th_purchase, reactivation_coupon)
      - `reward_value` (decimal) - Value of reward
      - `status` (text) - Status (pending, claimed, expired)
      - `issued_date` (date)
      - `expiry_date` (date)
      - `claimed_date` (date)
      - `created_at` (timestamptz)

    - `churn_alerts`
      - `id` (uuid, primary key)
      - `customer_id` (uuid, foreign key)
      - `days_since_purchase` (integer) - Days since last purchase
      - `alert_status` (text) - Status (active, contacted, reactivated, ignored)
      - `coupon_code` (text) - Generated coupon code
      - `coupon_value` (decimal) - Coupon discount value
      - `contacted_date` (date)
      - `reactivated_date` (date)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  ## 2. Functions and Triggers
    - Auto-update customer statistics on new orders
    - Auto-calculate loyalty tier based on LTV and purchase frequency
    - Trigger reward eligibility on 10th purchase
    - Auto-generate churn alerts for inactive customers

  ## 3. Security
    - Enable RLS on all tables
    - Policies for authenticated users to manage customer data
    - Policies for viewing loyalty rewards and alerts

  ## 4. Important Notes
    - Loyalty tiers: 1 leaf (< $500), 2 leaves ($500-$2000), 3 leaves (> $2000)
    - Rewards trigger every 10 purchases
    - Churn detection: 45 days without purchase for customers with 3+ orders
    - All monetary values use decimal(10,2) for precision
*/

-- Create customers table
CREATE TABLE IF NOT EXISTS customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text UNIQUE NOT NULL,
  phone text,
  address text,
  total_purchases integer DEFAULT 0,
  total_spent decimal(10,2) DEFAULT 0.00,
  loyalty_tier integer DEFAULT 1,
  reward_count integer DEFAULT 0,
  last_purchase_date date,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create customer_orders table
CREATE TABLE IF NOT EXISTS customer_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  order_number text UNIQUE NOT NULL,
  order_date date DEFAULT CURRENT_DATE,
  total_amount decimal(10,2) NOT NULL,
  items jsonb DEFAULT '[]'::jsonb,
  status text DEFAULT 'pending',
  reward_eligible boolean DEFAULT false,
  reward_included boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Create loyalty_rewards table
CREATE TABLE IF NOT EXISTS loyalty_rewards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  order_id uuid REFERENCES customer_orders(id) ON DELETE SET NULL,
  reward_type text NOT NULL,
  reward_value decimal(10,2) DEFAULT 0.00,
  status text DEFAULT 'pending',
  issued_date date DEFAULT CURRENT_DATE,
  expiry_date date,
  claimed_date date,
  created_at timestamptz DEFAULT now()
);

-- Create churn_alerts table
CREATE TABLE IF NOT EXISTS churn_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  days_since_purchase integer NOT NULL,
  alert_status text DEFAULT 'active',
  coupon_code text UNIQUE,
  coupon_value decimal(10,2) DEFAULT 10.00,
  contacted_date date,
  reactivated_date date,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);
CREATE INDEX IF NOT EXISTS idx_customers_loyalty_tier ON customers(loyalty_tier);
CREATE INDEX IF NOT EXISTS idx_customer_orders_customer_id ON customer_orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_orders_date ON customer_orders(order_date DESC);
CREATE INDEX IF NOT EXISTS idx_loyalty_rewards_customer_id ON loyalty_rewards(customer_id);
CREATE INDEX IF NOT EXISTS idx_churn_alerts_status ON churn_alerts(alert_status);

-- Function to update customer statistics
CREATE OR REPLACE FUNCTION update_customer_statistics()
RETURNS TRIGGER AS $$
BEGIN
  -- Update customer totals
  UPDATE customers
  SET 
    total_purchases = (
      SELECT COUNT(*) 
      FROM customer_orders 
      WHERE customer_id = NEW.customer_id 
      AND status != 'cancelled'
    ),
    total_spent = (
      SELECT COALESCE(SUM(total_amount), 0) 
      FROM customer_orders 
      WHERE customer_id = NEW.customer_id 
      AND status != 'cancelled'
    ),
    last_purchase_date = NEW.order_date,
    updated_at = now()
  WHERE id = NEW.customer_id;

  -- Calculate loyalty tier based on total spent
  UPDATE customers
  SET loyalty_tier = CASE
    WHEN total_spent >= 2000 THEN 3
    WHEN total_spent >= 500 THEN 2
    ELSE 1
  END
  WHERE id = NEW.customer_id;

  -- Check if this is the 10th purchase (or 20th, 30th, etc.)
  DECLARE
    purchase_count integer;
  BEGIN
    SELECT total_purchases INTO purchase_count
    FROM customers
    WHERE id = NEW.customer_id;

    IF purchase_count % 10 = 0 AND purchase_count > 0 THEN
      -- Mark order as reward eligible
      UPDATE customer_orders
      SET reward_eligible = true
      WHERE id = NEW.id;

      -- Create loyalty reward
      INSERT INTO loyalty_rewards (
        customer_id,
        order_id,
        reward_type,
        reward_value,
        status,
        expiry_date
      ) VALUES (
        NEW.customer_id,
        NEW.id,
        '10th_purchase',
        0.00,
        'pending',
        CURRENT_DATE + INTERVAL '90 days'
      );

      -- Increment reward count
      UPDATE customers
      SET reward_count = reward_count + 1
      WHERE id = NEW.customer_id;
    END IF;
  END;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update customer statistics on new order
DROP TRIGGER IF EXISTS trigger_update_customer_statistics ON customer_orders;
CREATE TRIGGER trigger_update_customer_statistics
AFTER INSERT OR UPDATE ON customer_orders
FOR EACH ROW
EXECUTE FUNCTION update_customer_statistics();

-- Function to generate churn alerts
CREATE OR REPLACE FUNCTION generate_churn_alerts()
RETURNS void AS $$
BEGIN
  -- Insert new churn alerts for customers who haven't purchased in 45 days
  INSERT INTO churn_alerts (customer_id, days_since_purchase, coupon_code, coupon_value)
  SELECT 
    c.id,
    CURRENT_DATE - c.last_purchase_date AS days_since_purchase,
    'CTP-' || UPPER(SUBSTRING(MD5(RANDOM()::text) FROM 1 FOR 8)),
    15.00
  FROM customers c
  WHERE c.total_purchases >= 3
    AND c.last_purchase_date IS NOT NULL
    AND CURRENT_DATE - c.last_purchase_date >= 45
    AND NOT EXISTS (
      SELECT 1 FROM churn_alerts ca
      WHERE ca.customer_id = c.id
      AND ca.alert_status IN ('active', 'contacted')
    );
END;
$$ LANGUAGE plpgsql;

-- Enable Row Level Security
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE churn_alerts ENABLE ROW LEVEL SECURITY;

-- Policies for customers table
CREATE POLICY "Authenticated users can view all customers"
  ON customers FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert customers"
  ON customers FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update customers"
  ON customers FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete customers"
  ON customers FOR DELETE
  TO authenticated
  USING (true);

-- Policies for customer_orders table
CREATE POLICY "Authenticated users can view all orders"
  ON customer_orders FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert orders"
  ON customer_orders FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update orders"
  ON customer_orders FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete orders"
  ON customer_orders FOR DELETE
  TO authenticated
  USING (true);

-- Policies for loyalty_rewards table
CREATE POLICY "Authenticated users can view all rewards"
  ON loyalty_rewards FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert rewards"
  ON loyalty_rewards FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update rewards"
  ON loyalty_rewards FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete rewards"
  ON loyalty_rewards FOR DELETE
  TO authenticated
  USING (true);

-- Policies for churn_alerts table
CREATE POLICY "Authenticated users can view all churn alerts"
  ON churn_alerts FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert churn alerts"
  ON churn_alerts FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update churn alerts"
  ON churn_alerts FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete churn alerts"
  ON churn_alerts FOR DELETE
  TO authenticated
  USING (true);
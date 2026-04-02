-- Seed script is idempotent: safe to run multiple times.
-- 1) Investors
INSERT INTO investors (name, email, phone, account_balance) VALUES
('Alice Smith', 'alice@invest.com', '555-1234', 100000.00),
('Bob Jones', 'bob@invest.com', '555-5678', 100000.00),
('Charlie Brown', 'charlie@invest.com', '555-9012', 100000.00)
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  phone = VALUES(phone),
  account_balance = VALUES(account_balance);

-- 2) Ensure each investor has a portfolio (covers cases where trigger was added later)
INSERT IGNORE INTO portfolio (investor_id)
SELECT investor_id FROM investors;

-- 3) Stocks
INSERT INTO stocks (symbol, company_name) VALUES
('AAPL', 'Apple Inc.'),
('GOOGL', 'Alphabet Inc.'),
('MSFT', 'Microsoft Corporation'),
('TSLA', 'Tesla, Inc.'),
('AMZN', 'Amazon.com, Inc.')
ON DUPLICATE KEY UPDATE
  company_name = VALUES(company_name);

-- 4) Multi-day price history rows (for charts + daily gain/loss)
INSERT INTO stock_prices (stock_id, price, volume, recorded_at)
SELECT s.stock_id, p.price, p.volume, p.recorded_at
FROM (
  SELECT 'AAPL' AS symbol, 171.20 AS price, 910000 AS volume, DATE_SUB(CURRENT_TIMESTAMP, INTERVAL 5 DAY) AS recorded_at
  UNION ALL SELECT 'AAPL', 172.40, 935000, DATE_SUB(CURRENT_TIMESTAMP, INTERVAL 4 DAY)
  UNION ALL SELECT 'AAPL', 174.00, 962000, DATE_SUB(CURRENT_TIMESTAMP, INTERVAL 3 DAY)
  UNION ALL SELECT 'AAPL', 173.35, 887000, DATE_SUB(CURRENT_TIMESTAMP, INTERVAL 2 DAY)
  UNION ALL SELECT 'AAPL', 174.90, 998000, DATE_SUB(CURRENT_TIMESTAMP, INTERVAL 1 DAY)
  UNION ALL SELECT 'AAPL', 175.50, 1000000, CURRENT_TIMESTAMP

  UNION ALL SELECT 'GOOGL', 136.10, 760000, DATE_SUB(CURRENT_TIMESTAMP, INTERVAL 5 DAY)
  UNION ALL SELECT 'GOOGL', 137.85, 780000, DATE_SUB(CURRENT_TIMESTAMP, INTERVAL 4 DAY)
  UNION ALL SELECT 'GOOGL', 138.70, 805000, DATE_SUB(CURRENT_TIMESTAMP, INTERVAL 3 DAY)
  UNION ALL SELECT 'GOOGL', 139.10, 820000, DATE_SUB(CURRENT_TIMESTAMP, INTERVAL 2 DAY)
  UNION ALL SELECT 'GOOGL', 139.95, 790000, DATE_SUB(CURRENT_TIMESTAMP, INTERVAL 1 DAY)
  UNION ALL SELECT 'GOOGL', 140.20, 800000, CURRENT_TIMESTAMP

  UNION ALL SELECT 'MSFT', 302.25, 910000, DATE_SUB(CURRENT_TIMESTAMP, INTERVAL 5 DAY)
  UNION ALL SELECT 'MSFT', 305.40, 930000, DATE_SUB(CURRENT_TIMESTAMP, INTERVAL 4 DAY)
  UNION ALL SELECT 'MSFT', 307.15, 940000, DATE_SUB(CURRENT_TIMESTAMP, INTERVAL 3 DAY)
  UNION ALL SELECT 'MSFT', 308.95, 955000, DATE_SUB(CURRENT_TIMESTAMP, INTERVAL 2 DAY)
  UNION ALL SELECT 'MSFT', 309.70, 948000, DATE_SUB(CURRENT_TIMESTAMP, INTERVAL 1 DAY)
  UNION ALL SELECT 'MSFT', 310.80, 950000, CURRENT_TIMESTAMP

  UNION ALL SELECT 'TSLA', 205.60, 1350000, DATE_SUB(CURRENT_TIMESTAMP, INTERVAL 5 DAY)
  UNION ALL SELECT 'TSLA', 208.30, 1400000, DATE_SUB(CURRENT_TIMESTAMP, INTERVAL 4 DAY)
  UNION ALL SELECT 'TSLA', 210.90, 1425000, DATE_SUB(CURRENT_TIMESTAMP, INTERVAL 3 DAY)
  UNION ALL SELECT 'TSLA', 212.40, 1460000, DATE_SUB(CURRENT_TIMESTAMP, INTERVAL 2 DAY)
  UNION ALL SELECT 'TSLA', 214.00, 1480000, DATE_SUB(CURRENT_TIMESTAMP, INTERVAL 1 DAY)
  UNION ALL SELECT 'TSLA', 215.10, 1500000, CURRENT_TIMESTAMP

  UNION ALL SELECT 'AMZN', 141.30, 700000, DATE_SUB(CURRENT_TIMESTAMP, INTERVAL 5 DAY)
  UNION ALL SELECT 'AMZN', 142.00, 715000, DATE_SUB(CURRENT_TIMESTAMP, INTERVAL 4 DAY)
  UNION ALL SELECT 'AMZN', 143.10, 722000, DATE_SUB(CURRENT_TIMESTAMP, INTERVAL 3 DAY)
  UNION ALL SELECT 'AMZN', 144.20, 735000, DATE_SUB(CURRENT_TIMESTAMP, INTERVAL 2 DAY)
  UNION ALL SELECT 'AMZN', 145.00, 745000, DATE_SUB(CURRENT_TIMESTAMP, INTERVAL 1 DAY)
  UNION ALL SELECT 'AMZN', 145.90, 750000, CURRENT_TIMESTAMP
) p
JOIN stocks s ON s.symbol = p.symbol;

-- 5) Base holdings for demo SELL orders
INSERT INTO holdings (portfolio_id, stock_id, stock_quantity)
SELECT p.portfolio_id, s.stock_id, 100
FROM investors i
JOIN portfolio p ON p.investor_id = i.investor_id
JOIN stocks s ON s.symbol = 'AAPL'
WHERE i.email = 'alice@invest.com'
ON DUPLICATE KEY UPDATE
  stock_quantity = GREATEST(holdings.stock_quantity, VALUES(stock_quantity));

INSERT INTO holdings (portfolio_id, stock_id, stock_quantity)
SELECT p.portfolio_id, s.stock_id, 50
FROM investors i
JOIN portfolio p ON p.investor_id = i.investor_id
JOIN stocks s ON s.symbol = 'TSLA'
WHERE i.email = 'bob@invest.com'
ON DUPLICATE KEY UPDATE
  stock_quantity = GREATEST(holdings.stock_quantity, VALUES(stock_quantity));

-- 6) Demo OPEN orders so Orders page is not empty
INSERT INTO orders (investor_id, stock_id, order_type, order_quantity, order_price, order_status)
SELECT i.investor_id, s.stock_id, 'BUY', 10, 210.00, 'OPEN'
FROM investors i
JOIN stocks s ON s.symbol = 'TSLA'
WHERE i.email = 'alice@invest.com'
  AND NOT EXISTS (
    SELECT 1
    FROM orders o
    WHERE o.investor_id = i.investor_id
      AND o.stock_id = s.stock_id
      AND o.order_type = 'BUY'
      AND o.order_quantity = 10
      AND o.order_price = 210.00
      AND o.order_status IN ('OPEN', 'PARTIAL', 'FILLED')
  );

INSERT INTO orders (investor_id, stock_id, order_type, order_quantity, order_price, order_status)
SELECT i.investor_id, s.stock_id, 'SELL', 5, 220.00, 'OPEN'
FROM investors i
JOIN stocks s ON s.symbol = 'AAPL'
WHERE i.email = 'alice@invest.com'
  AND NOT EXISTS (
    SELECT 1
    FROM orders o
    WHERE o.investor_id = i.investor_id
      AND o.stock_id = s.stock_id
      AND o.order_type = 'SELL'
      AND o.order_quantity = 5
      AND o.order_price = 220.00
      AND o.order_status IN ('OPEN', 'PARTIAL', 'FILLED')
  );

INSERT INTO orders (investor_id, stock_id, order_type, order_quantity, order_price, order_status)
SELECT i.investor_id, s.stock_id, 'SELL', 5, 209.00, 'OPEN'
FROM investors i
JOIN stocks s ON s.symbol = 'TSLA'
WHERE i.email = 'bob@invest.com'
  AND NOT EXISTS (
    SELECT 1
    FROM orders o
    WHERE o.investor_id = i.investor_id
      AND o.stock_id = s.stock_id
      AND o.order_type = 'SELL'
      AND o.order_quantity = 5
      AND o.order_price = 209.00
      AND o.order_status IN ('OPEN', 'PARTIAL', 'FILLED')
  );

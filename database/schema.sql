CREATE TABLE investors (
    investor_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    phone VARCHAR(15),
    account_balance DECIMAL(15,2) NOT NULL CHECK (account_balance >= 0)
) ENGINE=InnoDB;

CREATE TABLE portfolio (
    portfolio_id INT AUTO_INCREMENT PRIMARY KEY,
    investor_id INT UNIQUE NOT NULL,
    FOREIGN KEY (investor_id) REFERENCES investors(investor_id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE stocks (
    stock_id INT AUTO_INCREMENT PRIMARY KEY,
    symbol VARCHAR(20) UNIQUE NOT NULL,
    company_name VARCHAR(100) NOT NULL
) ENGINE=InnoDB;

CREATE TABLE stock_prices (
    id INT AUTO_INCREMENT PRIMARY KEY,
    stock_id INT NOT NULL,
    price DECIMAL(10,2) NOT NULL CHECK (price > 0),
    volume BIGINT NOT NULL DEFAULT 0,
    recorded_at TIMESTAMP NOT NULL,
    FOREIGN KEY (stock_id) REFERENCES stocks(stock_id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE orders (
    order_id INT AUTO_INCREMENT PRIMARY KEY,
    investor_id INT NOT NULL,
    stock_id INT NOT NULL,
    order_type VARCHAR(4) NOT NULL CHECK (order_type IN ('BUY', 'SELL')),
    order_quantity INT NOT NULL CHECK (order_quantity > 0),
    executed_quantity INT NOT NULL DEFAULT 0 
    CHECK (executed_quantity >= 0 AND executed_quantity <= order_quantity),
    order_price DECIMAL(10,2) NOT NULL CHECK (order_price > 0),
    order_status VARCHAR(20) DEFAULT 'OPEN',
    order_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (investor_id) REFERENCES investors(investor_id) ON DELETE CASCADE,
    FOREIGN KEY (stock_id) REFERENCES stocks(stock_id),
    CHECK (order_status IN ('OPEN', 'PARTIAL', 'FILLED', 'CANCELLED'))
) ENGINE=InnoDB;

CREATE TABLE trades (
    trade_id INT AUTO_INCREMENT PRIMARY KEY,
    stock_id INT NOT NULL,
    buy_order_id INT NOT NULL,
    sell_order_id INT NOT NULL,
    trade_price DECIMAL(10,2) NOT NULL CHECK (trade_price > 0),
    trade_quantity INT NOT NULL CHECK (trade_quantity > 0),
    trade_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (buy_order_id) REFERENCES orders(order_id) ON DELETE CASCADE,
    FOREIGN KEY (sell_order_id) REFERENCES orders(order_id) ON DELETE CASCADE,
    FOREIGN KEY (stock_id) REFERENCES stocks(stock_id),

    CHECK (buy_order_id <> sell_order_id)
) ENGINE=InnoDB;


CREATE TABLE holdings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    portfolio_id INT NOT NULL,
    stock_id INT NOT NULL,
    stock_quantity INT NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
    UNIQUE (portfolio_id, stock_id),
    FOREIGN KEY (portfolio_id) REFERENCES portfolio(portfolio_id) ON DELETE CASCADE,
    FOREIGN KEY (stock_id) REFERENCES stocks(stock_id)
) ENGINE=InnoDB;
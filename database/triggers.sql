DELIMITER $$

CREATE TRIGGER after_investor_insert
AFTER INSERT ON investors
FOR EACH ROW
BEGIN
    INSERT IGNORE INTO portfolio (investor_id) VALUES (NEW.investor_id);

    INSERT INTO holdings (portfolio_id, stock_id, stock_quantity)
    SELECT p.portfolio_id, s.stock_id, 20
    FROM portfolio p
    CROSS JOIN stocks s
        WHERE p.investor_id = NEW.investor_id;
END$$


CREATE TRIGGER before_order_insert
BEFORE INSERT ON orders
FOR EACH ROW
BEGIN
    DECLARE held INT DEFAULT 0;

    IF NEW.order_type = 'SELL' THEN
        SELECT COALESCE(h.stock_quantity, 0) INTO held
        FROM portfolio p
        LEFT JOIN holdings h ON h.portfolio_id = p.portfolio_id
                             AND h.stock_id = NEW.stock_id
        WHERE p.investor_id = NEW.investor_id;

        IF held < NEW.order_quantity THEN
            SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Insufficient holdings to place SELL order';
        END IF;
    END IF;
END$$


CREATE TRIGGER before_order_insert_balance
BEFORE INSERT ON orders
FOR EACH ROW
BEGIN
    DECLARE bal DECIMAL(15,2);

    IF NEW.order_type = 'BUY' THEN
        SELECT account_balance INTO bal
        FROM investors WHERE investor_id = NEW.investor_id;

        IF bal < (NEW.order_quantity * NEW.order_price) THEN
            SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Insufficient balance to place BUY order';
        END IF;
    END IF;
END$$

DELIMITER ;

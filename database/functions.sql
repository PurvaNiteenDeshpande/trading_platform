DELIMITER $$


CREATE FUNCTION get_latest_price(p_stock_id INT)
RETURNS DECIMAL(10,2)
DETERMINISTIC
READS SQL DATA
BEGIN
    DECLARE latest DECIMAL(10,2);
    SELECT price INTO latest
    FROM stock_prices
    WHERE stock_id = p_stock_id
    ORDER BY recorded_at DESC
    LIMIT 1;
    RETURN COALESCE(latest, 0.00);
END$$


CREATE FUNCTION get_portfolio_value(p_investor_id INT)
RETURNS DECIMAL(15,2)
DETERMINISTIC
READS SQL DATA
BEGIN
    DECLARE total DECIMAL(15,2);
    SELECT COALESCE(SUM(h.stock_quantity * get_latest_price(h.stock_id)), 0)
    INTO total
    FROM portfolio p
    JOIN holdings h ON h.portfolio_id = p.portfolio_id
    WHERE p.investor_id = p_investor_id;
    RETURN total;
END$$

DELIMITER ;

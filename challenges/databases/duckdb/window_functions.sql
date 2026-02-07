-- DuckDB Window Functions Example
-- Run with: duckdb < window_functions.sql

-- Create sample sales data
CREATE TABLE sales AS
SELECT * FROM (VALUES
    ('2024-01-01', 'Widget A', 'North', 1000),
    ('2024-01-01', 'Widget B', 'North', 800),
    ('2024-01-01', 'Widget A', 'South', 1200),
    ('2024-02-01', 'Widget A', 'North', 1100),
    ('2024-02-01', 'Widget B', 'North', 900),
    ('2024-02-01', 'Widget A', 'South', 1300),
    ('2024-03-01', 'Widget A', 'North', 1250),
    ('2024-03-01', 'Widget B', 'North', 950),
    ('2024-03-01', 'Widget A', 'South', 1400)
) AS t(sale_date, product, region, amount);

-- 1. Running Total per Product
SELECT 
    sale_date,
    product,
    amount,
    SUM(amount) OVER (
        PARTITION BY product 
        ORDER BY sale_date
        ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
    ) as running_total
FROM sales
ORDER BY product, sale_date;

-- 2. Rank Products by Total Sales within Region
SELECT 
    region,
    product,
    total_sales,
    RANK() OVER (PARTITION BY region ORDER BY total_sales DESC) as rank
FROM (
    SELECT region, product, SUM(amount) as total_sales
    FROM sales
    GROUP BY region, product
);

-- 3. Month-over-Month Change using LAG
SELECT 
    sale_date,
    product,
    amount,
    LAG(amount) OVER (PARTITION BY product ORDER BY sale_date) as prev_month,
    amount - LAG(amount) OVER (PARTITION BY product ORDER BY sale_date) as mom_change,
    ROUND(
        (amount - LAG(amount) OVER (PARTITION BY product ORDER BY sale_date)) * 100.0 / 
        LAG(amount) OVER (PARTITION BY product ORDER BY sale_date), 
        2
    ) as mom_pct_change
FROM sales
ORDER BY product, sale_date;

DROP TABLE IF EXISTS products;
CREATE TABLE IF NOT EXISTS products (
 id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  price REAL NOT NULL,
  description TEXT
  );
INSERT INTO products (name, price, description) 
VALUES ('Frappie Apple', '5.99', 'Frappies favourite');
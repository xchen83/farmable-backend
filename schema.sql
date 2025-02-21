DROP TABLE IF EXISTS products;
CREATE TABLE IF NOT EXISTS products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  productName TEXT NOT NULL,
  category TEXT NOT NULL,
  shelfLife INTEGER,
  shelfLifeUnit TEXT,
  unlimitedShelfLife BOOLEAN NOT NULL DEFAULT false,
  packUnit TEXT NOT NULL,
  description TEXT,
  productImage TEXT
);

CREATE TABLE IF NOT EXISTS customers (
    customer_id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    phone TEXT,
    total_spent REAL DEFAULT 0,
    transaction_count INTEGER DEFAULT 0,
    last_transaction_date TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
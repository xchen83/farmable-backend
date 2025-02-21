DROP TABLE IF EXISTS products;
CREATE TABLE IF NOT EXISTS products (
  product_id INTEGER PRIMARY KEY AUTOINCREMENT,
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

CREATE TABLE IF NOT EXISTS orders (
    order_id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_id INTEGER NOT NULL,
    order_date TEXT NOT NULL,
    required_date TEXT NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    status TEXT DEFAULT 'pending',
    FOREIGN KEY (customer_id) REFERENCES customers(customer_id)
);

CREATE TABLE IF NOT EXISTS order_items (
    order_item_id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL,
    requested_quantity DECIMAL(10,2) NOT NULL,
    fulfilled_quantity DECIMAL(10,2),
    remaining_quantity DECIMAL(10,2),
    unit_price DECIMAL(10,2) NOT NULL,
    status TEXT DEFAULT 'pending',
    system_note TEXT,
    FOREIGN KEY (order_id) REFERENCES orders(order_id),
    FOREIGN KEY (product_id) REFERENCES products(product_id)
);

CREATE TABLE IF NOT EXISTS inventory (
    inventory_id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER NOT NULL,
    quantity_available DECIMAL(10,2) NOT NULL,
    last_updated TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(product_id)
);
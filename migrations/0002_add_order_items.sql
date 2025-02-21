DROP TABLE IF EXISTS order_items;
CREATE TABLE order_items (
    order_item_id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL,
    requested_quantity DECIMAL(10,2) NOT NULL,
    fulfilled_quantity DECIMAL(10,2) DEFAULT 0,
    remaining_quantity DECIMAL(10,2),
    unit_price DECIMAL(10,2) NOT NULL,
    status TEXT DEFAULT 'pending',
    system_note TEXT,
    FOREIGN KEY (order_id) REFERENCES orders(order_id),
    FOREIGN KEY (product_id) REFERENCES products(product_id)
);

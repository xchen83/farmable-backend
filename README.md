# Farmable Backend

This is the backend API for the Farmable project, built with Cloudflare Pages Functions and D1 database.

## Project Structure
farmable-backend/
├── functions/
│ └── api/
│ └── products.ts # API endpoint for products
├── index.js # Entry point
├── package.json # Dependencies and scripts
├── wrangler.toml # Cloudflare configuration
└── schema.sql # Database schema


## Setup

1. Install dependencies:
bash
npm install

2. Create a D1 database (if not already created):
bash
wrangler d1 create farmable-database

3. Apply the database schema:
bash
wrangler d1 execute farmable-database --file=schema.sql


## Development

Run the development server:
bash
npm run dev


The API will be available at: `https://farmable-backend.pages.dev/api/products`

## API Endpoints

### GET /api/products
Returns all products in the database.

### POST /api/products
Creates a new product. Required fields:
- productName (string)
- category (string)
- shelfLife (number, optional)
- shelfLifeUnit (string, optional)
- unlimitedShelfLife (boolean)
- packUnit (string)
- description (string, optional)
- productImage (string, optional)

## Database Schema
sql
CREATE TABLE products (
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


## Environment Variables

The project uses Cloudflare D1 for the database. The database binding is configured in `wrangler.toml`.

## Testing

To test your remote database, you can use these commands:

1. View all products in the remote database:
```bash
wrangler d1 execute farmable-database --remote --command="SELECT * FROM products"
```

2. Add a test product to remote database:
```bash
wrangler d1 execute farmable-database --remote --command="INSERT INTO products (productName, category, shelfLife, shelfLifeUnit, unlimitedShelfLife, packUnit, description) VALUES ('Test Remote Apple', 'Fruits', 14, 'days', 0, 'kg', 'Testing remote database')"
```

3. Test the remote API endpoint directly:
```bash
curl https://farmable-backend.pages.dev/api/products
```

4. Add a product through the remote API:
```bash
curl -X POST https://farmable-backend.pages.dev/api/products \
-H "Content-Type: application/json" \
-d '{
  "productName": "API Test Apple",
  "category": "Fruits",
  "shelfLife": 14,
  "shelfLifeUnit": "days",
  "unlimitedShelfLife": false,
  "packUnit": "kg",
  "description": "Testing API insertion"
}'
```

The key is using the `--remote` flag with wrangler commands to interact with the remote database. Would you like to try these tests?
# Farmable Backend API

A Cloudflare Workers-based backend API for the Farmable application, using D1 database for data storage.

## 🚀 Features

- RESTful API endpoints for:
  - Products management
  - Customer records
  - Order processing
  - Inventory tracking
- Built with Cloudflare Workers and D1 Database
- TypeScript support
- CORS enabled for frontend integration

## 📋 API Endpoints

### Products
- `GET /api/products` - Get all products
- `POST /api/products` - Create a new product
- `PUT /api/products/:id` - Update a product
- `DELETE /api/products/:id` - Delete a product

### Database Schema
sql
CREATE TABLE products (
product_id INTEGER PRIMARY KEY AUTOINCREMENT,
productName TEXT NOT NULL,
category TEXT NOT NULL,
packUnit TEXT NOT NULL,
description TEXT
);
-- More tables defined in schema.sql

## 🛠️ Development Setup
1. Clone the repository:
bash
git clone https://github.com/xchen83/farmable-backend.git
cd farmable-backend

2. Install dependencies:
bash
npm install

3. Configure Wrangler:
toml

wrangler.toml
name = "farmable-backend"
main = "functions/index.ts"
[[d1_databases]]
binding = "DB"
database_name = "farmable-database"
database_id = "your-database-id"

4. Run locally:
```bash
npm run dev
```

5. Deploy:
```bash
npm run deploy
```

## 🔧 Development

### Local Development
1. Start the development server:
```bash
npm run dev
```

2. Access the API at `http://localhost:8787`

### Database Operations
- Apply schema:
```bash
wrangler d1 execute farmable-database --local --file=./schema.sql
```

- Add test data:
```bash
wrangler d1 execute farmable-database --local --command="INSERT INTO products..."
```

## 📚 Tech Stack

- [Cloudflare Workers](https://workers.cloudflare.com/)
- [Hono](https://honojs.dev/) - Web framework
- [D1 Database](https://developers.cloudflare.com/d1/)
- TypeScript

## 🔐 Environment Variables

Required environment variables in `wrangler.toml`:
- `database_id`: 6cd713c9-04f3-4edc-9569-33f7f85de808
- `database_name`: farmable-database

## 👥 Contributors

- Catherine Chen
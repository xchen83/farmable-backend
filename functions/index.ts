// functions/index.ts
// Update the CORS configuration to include your deployed domain

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import type { Env, Product, Order, OrderItem, Customer, ApiResponse } from './types';
import products from './api/products';
import customers from './api/customers';
import orders from './api/orders';
import order_items from './api/order_items';

// Define types
type Bindings = {
    DB: D1Database;
};

type Variables = {
    // Add any variables you need
};

const app = new Hono<{ Bindings: Bindings, Variables: Variables }>();

// Global CORS - Updated to include both localhost and your deployed domains
app.use('/*', cors({
    origin: [
        'http://localhost:4200',          // Local development
        'https://farmable.pages.dev',     // Main deployment
        'https://bc839dba.farmable.pages.dev', // Your current deployment subdomain
        'https://*.farmable.pages.dev'    // Any subdomain (wildcard) for future deployments
    ],
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}));

// Mount all routes
app.route('/api/products', products);
app.route('/api/customers', customers);
app.route('/api/orders', orders);
app.route('/api/order-items', order_items);

// Basic health check endpoint
// functions/index.ts - Find the GET /api/orders endpoint and update it
app.get('/api/orders', async (c) => {
    try {
      const { DB } = c.env;
      const result = await DB.prepare(`
        SELECT o.*, c.name as customer_name, c.email as customer_email, 
               c.transaction_count, c.phone, c.total_spent, 
               c.last_transaction_date
        FROM orders o
        JOIN customers c ON o.customer_id = c.customer_id
        ORDER BY o.order_date DESC
      `).all();
  
      // Format orders with customer objects
      const orders = result.results.map(order => {
        return {
          ...order,
          customer: {
            customer_id: order.customer_id,
            name: order.customer_name,
            email: order.customer_email,
            phone: order.phone,
            transaction_count: order.transaction_count,
            total_spent: order.total_spent,
            last_transaction_date: order.last_transaction_date
          }
        };
      });
  
      return c.json({
        success: true,
        data: orders
      });
    } catch (err: any) {
      console.error('Database error:', err);
      return c.json({
        success: false,
        error: err.message || 'Unknown error occurred'
      }, 500);
    }
  });
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

// Global CORS
app.use('/*', cors({
    origin: ['http://localhost:4200', 'https://farmable.pages.dev', 'https://2e34836e.farmable.pages.dev'],
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}));

// Mount all routes
app.route('/api/products', products);
app.route('/api/customers', customers);
app.route('/api/orders', orders);
app.route('/api/order-items', order_items);

// Basic health check endpoint
app.get('/', (c) => {
    return c.json({
        status: 'ok',
        message: 'Farmable API is running'
    });
});

// Orders route with customer info
app.get('/api/orders', async (c) => {
    try {
        const { DB } = c.env;
        const result = await DB.prepare(`
            SELECT o.*, c.name as customer_name 
            FROM orders o
            JOIN customers c ON o.customer_id = c.customer_id
            ORDER BY order_date DESC
        `).all();

        return c.json({
            success: true,
            data: result.results
        });
    } catch (err: any) {
        console.error('Database error:', err);
        return c.json({
            success: false,
            error: err.message || 'Unknown error occurred'
        }, 500);
    }
});

// Order Items route with product info
app.get('/api/order-items', async (c) => {
    try {
        const stmt = c.env.DB.prepare(`
            SELECT 
                oi.*,
                p.productName as product_name,
                p.packUnit
            FROM order_items oi
            JOIN products p ON oi.product_id = p.product_id
            ORDER BY oi.order_item_id DESC
        `);
        const { results } = await stmt.all<OrderItem>();

        return c.json({
            success: true,
            data: results
        } as ApiResponse<OrderItem[]>);
    } catch (error) {
        console.error('Error in order items route:', error);
        return c.json({
            success: false,
            error: 'Failed to fetch order items',
            details: error instanceof Error ? error.message : 'Unknown error'
        } as ApiResponse<null>, 500);
    }
});

// Test database endpoint
app.get('/api/test', async (c) => {
    try {
        const { DB } = c.env;
        const result = await DB.prepare('SELECT * FROM products LIMIT 1').all();
        return c.json({
            success: true,
            data: result,
            message: "Database connection successful"
        });
    } catch (err: any) {
        console.error('Database error:', err);
        return c.json({
            success: false,
            error: err.message || 'Unknown error occurred'
        }, 500);
    }
});

// New inventory endpoint
app.get('/api/inventory', async (c) => {
    try {
        const { DB } = c.env;
        const result = await DB.prepare(`
            SELECT i.*, p.productName
            FROM inventory i
            JOIN products p ON i.product_id = p.product_id
        `).all();

        return c.json({
            success: true,
            data: result.results
        });
    } catch (err: any) {
        console.error('Database error:', err);
        return c.json({
            success: false,
            error: err.message || 'Unknown error occurred'
        }, 500);
    }
});

// Order details endpoint (includes order items)
app.get('/api/orders/:orderId', async (c) => {
    try {
        const orderId = c.req.param('orderId');
        const db = c.env.DB;

        // Get order header
        const orderResult = await db.prepare(`
            SELECT o.*, c.name as customer_name, c.email as customer_email
            FROM orders o
            JOIN customers c ON o.customer_id = c.customer_id
            WHERE o.order_id = ?
        `).bind(orderId).all();

        // Get order items
        const itemsResult = await db.prepare(`
            SELECT oi.*, p.productName, p.packUnit
            FROM order_items oi
            JOIN products p ON oi.product_id = p.product_id
            WHERE oi.order_id = ?
        `).bind(orderId).all();

        return c.json({
            success: true,
            data: {
                order: orderResult.results[0],
                items: itemsResult.results
            }
        });
    } catch (err: any) {
        console.error('Database error:', err);
        return c.json({
            success: false,
            error: err.message || 'Unknown error occurred'
        }, 500);
    }
});

export default app; 
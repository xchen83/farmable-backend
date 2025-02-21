import { Hono } from 'hono';
import type { Env, Product, Order, OrderItem, Customer, ApiResponse } from './types';
import products from './api/products';

// Define types
type Bindings = {
    DB: D1Database;
};

type Variables = {
    // Add any variables you need
};

const app = new Hono<{ Bindings: Bindings, Variables: Variables }>();

// Mount the products routes
app.route('/api/products', products);

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
        const db = c.env.DB;
        const result = await db.prepare(`
            SELECT o.order_id, o.order_date, o.required_date, 
                   o.total_amount, o.status,
                   c.name as customer_name, c.email as customer_email
            FROM orders o
            JOIN customers c ON o.customer_id = c.customer_id
            ORDER BY o.order_date DESC
        `).all();

        return c.json({
            success: true,
            data: result.results,
            count: result.results.length
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

// Customers route
app.get('/api/customers', async (c) => {
    try {
        const db = c.env.DB;
        const result = await db.prepare(`
            SELECT customer_id, name, email, phone, total_spent, 
                   transaction_count, last_transaction_date, created_at 
            FROM customers
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
        const db = c.env.DB;
        const result = await db.prepare(`
            SELECT i.inventory_id, i.quantity_available, i.last_updated,
                   p.productName, p.category, p.packUnit
            FROM inventory i
            JOIN products p ON i.product_id = p.product_id
            ORDER BY p.productName
        `).all();

        return c.json({
            success: true,
            data: result.results,
            count: result.results.length
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
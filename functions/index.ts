import { Hono } from 'hono';
import type { Env, Product, ApiResponse } from './types';

const app = new Hono<{ Bindings: Env }>();

// Add a test route
app.get('/test', (c) => c.text('API is working'));

// Products route
app.get('/api/products', async (c) => {
    console.log('Products route hit');
    try {
        if (!c.env?.DB) {
            console.error('No DB connection available');
            return c.json({
                success: false,
                error: 'Database connection not available'
            } as ApiResponse<null>, 500);
        }

        console.log('Attempting to query database...');
        const { results } = await c.env.DB.prepare(
            'SELECT * FROM products ORDER BY id DESC'
        ).all<Product>();

        console.log('Query results:', results);
        return c.json({
            success: true,
            data: results || []
        } as ApiResponse<Product[]>);
    } catch (error) {
        console.error('Error in products route:', error);
        return c.json({
            success: false,
            error: 'Failed to fetch products',
            details: error instanceof Error ? error.message : 'Unknown error'
        } as ApiResponse<null>, 500);
    }
});

// Customers route
app.get('/api/customers', async (c) => {
    try {
        if (!c.env?.DB) {
            return c.json({
                success: false,
                error: 'Database connection not available'
            } as ApiResponse<null>, 500);
        }

        const { results } = await c.env.DB.prepare(
            'SELECT * FROM customers ORDER BY customer_id DESC'
        ).all();
        return c.json({ success: true, data: results || [] } as ApiResponse<unknown[]>);
    } catch (error) {
        console.error('Error:', error);
        return c.json({
            success: false,
            error: 'Failed to fetch customers'
        } as ApiResponse<null>, 500);
    }
});

export default app; 
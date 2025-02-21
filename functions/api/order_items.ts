import { Hono } from 'hono'

type Bindings = {
    DB: D1Database;
}

type Variables = {}

const order_items = new Hono<{ Bindings: Bindings, Variables: Variables }>()

// GET all order items
order_items.get('/', async (c) => {
    try {
        const { DB } = c.env
        const result = await DB.prepare(`
      SELECT 
        oi.*,
        p.productName,
        p.category,
        p.packUnit
      FROM order_items oi
      LEFT JOIN products p ON oi.product_id = p.product_id
      ORDER BY oi.order_item_id DESC
    `).all()

        return c.json({
            success: true,
            data: result.results
        })
    } catch (err: any) {
        return c.json({
            success: false,
            error: err.message
        }, 500)
    }
})

export default order_items 
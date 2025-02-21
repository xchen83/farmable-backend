import { Hono } from 'hono'

type Bindings = {
    DB: D1Database;
}

type Variables = {}

const customers = new Hono<{ Bindings: Bindings, Variables: Variables }>()

// GET all customers
customers.get('/', async (c) => {
    try {
        const { DB } = c.env
        console.log('Attempting to fetch customers...')
        const result = await DB.prepare(`
      SELECT * FROM customers
      ORDER BY created_at DESC
    `).all()
        console.log('Query result:', result)
        return c.json({ success: true, data: result.results })
    } catch (err: any) {
        console.error('Error fetching customers:', err)
        return c.json({
            success: false,
            error: err.message,
            details: err.stack  // This will give us more debug info
        }, 500)
    }
})

// POST new customer
customers.post('/', async (c) => {
    try {
        const { DB } = c.env
        const { name, email, phone } = await c.req.json()

        const result = await DB.prepare(`
      INSERT INTO customers (name, email, phone)
      VALUES (?, ?, ?)
    `).bind(name, email, phone).run()

        return c.json({ success: true, id: result.meta.last_row_id })
    } catch (err: any) {
        return c.json({ success: false, error: err.message }, 500)
    }
})

export default customers 
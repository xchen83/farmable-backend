import { Hono } from 'hono'

type Bindings = {
    DB: D1Database;
}

type Variables = {}

const orders = new Hono<{ Bindings: Bindings, Variables: Variables }>()

// GET all orders with full details
orders.get('/', async (c) => {
    try {
        const { DB } = c.env
        console.log('Attempting to fetch orders with full details...')
        const result = await DB.prepare(`
      SELECT 
        o.*,
        json_object(
          'customer_id', c.customer_id,
          'name', c.name,
          'email', c.email,
          'phone', c.phone,
          'total_spent', c.total_spent,
          'transaction_count', c.transaction_count,
          'last_transaction_date', c.last_transaction_date,
          'created_at', c.created_at
        ) as customer,
        json_group_array(
          json_object(
            'order_item_id', oi.order_item_id,
            'product_id', oi.product_id,
            'requested_quantity', oi.requested_quantity,
            'fulfilled_quantity', oi.fulfilled_quantity,
            'remaining_quantity', oi.remaining_quantity,
            'unit_price', oi.unit_price,
            'status', oi.status,
            'system_note', oi.system_note,
            'product', json_object(
              'product_id', p.product_id,
              'productName', p.productName,
              'category', p.category,
              'packUnit', p.packUnit
            )
          )
        ) as order_items
      FROM orders o
      LEFT JOIN customers c ON o.customer_id = c.customer_id
      LEFT JOIN order_items oi ON o.order_id = oi.order_id
      LEFT JOIN products p ON oi.product_id = p.product_id
      GROUP BY o.order_id
      ORDER BY o.order_date DESC
    `).all()

        // Parse JSON strings in the result
        const orders = result.results.map((order: any) => ({
            ...order,
            customer: JSON.parse(order.customer),
            order_items: JSON.parse(order.order_items)
        }))

        return c.json({
            success: true,
            data: orders
        })
    } catch (err: any) {
        console.error('Error fetching orders:', err)
        return c.json({
            success: false,
            error: err.message,
            details: err.stack
        }, 500)
    }
})

// GET order list with product details
orders.get('/list', async (c) => {
    try {
        const { DB } = c.env
        console.log('Attempting to fetch order list...')

        const result = await DB.prepare(`
      SELECT 
        o.order_id,
        o.order_date,
        o.required_date,
        o.status as order_status,
        o.total_amount,
        c.name as customer_name,
        c.transaction_count,
        json_group_array(
          json_object(
            'productName', p.productName,
            'requested_quantity', oi.requested_quantity,
            'fulfilled_quantity', oi.fulfilled_quantity,
            'remaining_quantity', oi.remaining_quantity,
            'status', oi.status,
            'system_note', oi.system_note,
            'packUnit', p.packUnit
          )
        ) as items
      FROM orders o
      LEFT JOIN customers c ON o.customer_id = c.customer_id
      LEFT JOIN order_items oi ON o.order_id = oi.order_id
      LEFT JOIN products p ON oi.product_id = p.product_id
      GROUP BY o.order_id
      ORDER BY o.order_date DESC
    `).all()

        // Parse the items JSON string for each order
        const orders = result.results.map((order: any) => ({
            ...order,
            items: JSON.parse(order.items)
        }))

        return c.json({
            success: true,
            data: orders
        })
    } catch (err: any) {
        console.error('Error fetching order list:', err)
        return c.json({
            success: false,
            error: err.message,
            details: err.stack
        }, 500)
    }
})

// Keep existing POST, PUT, DELETE endpoints

export default orders
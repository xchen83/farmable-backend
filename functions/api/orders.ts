// functions/api/orders.ts - Adding order creation functionality
import { Hono } from 'hono'

type Bindings = {
  DB: D1Database;
}

type Variables = {}

const orders = new Hono<{ Bindings: Bindings, Variables: Variables }>()

// Existing API code...

// POST create a new order
orders.post('/', async (c) => {
  try {
    const { DB } = c.env
    const { 
      customer_id, 
      order_date, 
      required_date, 
      total_amount, 
      status = 'pending',
      order_items 
    } = await c.req.json()

    // Start database transaction
    const stmt = DB.prepare(`
      INSERT INTO orders (customer_id, order_date, required_date, total_amount, status)
      VALUES (?, ?, ?, ?, ?)
    `)
    
    const result = await stmt.bind(
      customer_id, 
      order_date, 
      required_date, 
      total_amount,
      status
    ).run()

    if (!result.success) {
      return c.json({
        success: false,
        error: "Failed to create order"
      }, 500)
    }

    const orderId = result.meta.last_row_id
    
    // Insert order items
    if (order_items && Array.isArray(order_items) && order_items.length > 0) {
      for (const item of order_items) {
        const { product_id, requested_quantity, unit_price } = item
        
        // Get current inventory
        const inventoryResult = await DB.prepare(`
          SELECT quantity_available FROM inventory WHERE product_id = ?
        `).bind(product_id).first()
        
        let fulfilledQuantity = requested_quantity
        let remainingQuantity = 0
        let status = 'completed'
        let systemNote = null
        
        // Check if inventory is sufficient
        if (inventoryResult && inventoryResult.quantity_available < requested_quantity) {
          fulfilledQuantity = inventoryResult.quantity_available || 0
          remainingQuantity = requested_quantity - fulfilledQuantity
          status = 'pending'
          systemNote = `Insufficient inventory. Requested: ${requested_quantity}, Available: ${fulfilledQuantity}`
        }
        
        // Insert order item
        await DB.prepare(`
          INSERT INTO order_items (
            order_id, 
            product_id, 
            requested_quantity, 
            fulfilled_quantity, 
            remaining_quantity, 
            unit_price, 
            status, 
            system_note
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
          orderId,
          product_id,
          requested_quantity,
          fulfilledQuantity,
          remainingQuantity,
          unit_price,
          status,
          systemNote
        ).run()
        
        // Update inventory
        if (fulfilledQuantity > 0) {
          await DB.prepare(`
            UPDATE inventory
            SET quantity_available = quantity_available - ?
            WHERE product_id = ?
          `).bind(fulfilledQuantity, product_id).run()
        }
      }
    }
    
    // Update customer transaction statistics
    await DB.prepare(`
      UPDATE customers
      SET 
        transaction_count = transaction_count + 1,
        total_spent = total_spent + ?,
        last_transaction_date = ?
      WHERE customer_id = ?
    `).bind(total_amount, order_date, customer_id).run()

    return c.json({ 
      success: true, 
      id: orderId,
      message: "Order created successfully" 
    })
  } catch (err: any) {
    console.error('Error creating order:', err)
    return c.json({ 
      success: false, 
      error: err.message 
    }, 500)
  }
})

// PUT update order status
orders.put('/:id/status', async (c) => {
  try {
    const { DB } = c.env
    const id = c.req.param('id')
    const { status } = await c.req.json()
    
    if (!['pending', 'accepted', 'completed', 'cancelled'].includes(status)) {
      return c.json({ 
        success: false, 
        error: "Invalid order status" 
      }, 400)
    }

    await DB.prepare(`
      UPDATE orders
      SET status = ?
      WHERE order_id = ?
    `).bind(status, id).run()

    return c.json({ success: true })
  } catch (err: any) {
    return c.json({ 
      success: false, 
      error: err.message 
    }, 500)
  }
})

// Other existing API endpoints remain unchanged...

export default orders
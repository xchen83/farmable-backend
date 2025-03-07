// functions/api/orders.ts
import { Hono } from 'hono'

type Bindings = {
  DB: D1Database;
}

type Variables = {}

const orders = new Hono<{ Bindings: Bindings, Variables: Variables }>()

// GET all orders with customer info
orders.get('/', async (c) => {
  try {
    const { DB } = c.env
    console.log('Attempting to fetch orders with customer info...')
    const result = await DB.prepare(`
      SELECT o.*, c.name as customer_name, c.email as customer_email, c.transaction_count, c.phone 
      FROM orders o
      JOIN customers c ON o.customer_id = c.customer_id
      ORDER BY o.order_date DESC
    `).all()
    
    console.log('Orders query result:', result)
    
    // Format orders with customer objects
    const orders = result.results.map(order => {
      return {
        ...order,
        customer: {
          customer_id: order.customer_id,
          name: order.customer_name,
          email: order.customer_email,
          phone: order.phone,
          transaction_count: order.transaction_count
        }
      };
    });
    
    // Get order items for each order
    for (const order of orders) {
      const itemsResult = await DB.prepare(`
        SELECT 
          oi.*,
          p.productName,
          p.category,
          p.packUnit
        FROM order_items oi
        LEFT JOIN products p ON oi.product_id = p.product_id
        WHERE oi.order_id = ?
      `).bind(order.order_id).all();
      
      // Attach order items to order
      order.order_items = itemsResult.results.map(item => ({
        ...item,
        product: {
          product_id: item.product_id,
          productName: item.productName,
          category: item.category,
          packUnit: item.packUnit
        }
      }));
    }
    
    return c.json({
      success: true,
      data: orders
    })
  } catch (err: any) {
    console.error('Error fetching orders:', err)
    return c.json({
      success: false,
      error: err.message,
      details: err.stack  // This will give us more debug info
    }, 500)
  }
})

// GET order by ID with customer and product details
orders.get('/:id', async (c) => {
  try {
    const orderId = c.req.param('id')
    const { DB } = c.env
    
    console.log(`Fetching order details for ID: ${orderId}`);
    
    // Get order with customer info
    const orderResult = await DB.prepare(`
      SELECT o.*, c.name as customer_name, c.email as customer_email, 
             c.transaction_count, c.total_spent, c.phone,
             c.last_transaction_date, c.created_at
      FROM orders o
      JOIN customers c ON o.customer_id = c.customer_id
      WHERE o.order_id = ?
    `).bind(orderId).all()
    
    if (orderResult.results.length === 0) {
      return c.json({
        success: false,
        error: "Order not found"
      }, 404)
    }
    
    const order = orderResult.results[0];
    console.log(`Order data:`, order);
    
    // Format customer object
    const customer = {
      customer_id: order.customer_id,
      name: order.customer_name,
      email: order.customer_email,
      phone: order.phone,
      transaction_count: order.transaction_count,
      total_spent: order.total_spent,
      last_transaction_date: order.last_transaction_date,
      created_at: order.created_at
    };
    
    // Add customer to order
    order.customer = customer;
    
    // Get order items with product details
    const itemsResult = await DB.prepare(`
      SELECT 
        oi.*,
        p.productName,
        p.category,
        p.packUnit,
        p.description,
        p.unlimitedShelfLife,
        p.shelfLife,
        p.shelfLifeUnit
      FROM order_items oi
      LEFT JOIN products p ON oi.product_id = p.product_id
      WHERE oi.order_id = ?
    `).bind(orderId).all();
    
    console.log(`Order items result:`, itemsResult.results);
    
    // Transform order items to include product object
    const items = itemsResult.results.map(item => {
      return {
        ...item,
        product: {
          product_id: item.product_id,
          productName: item.productName || 'Unknown Product',
          category: item.category,
          packUnit: item.packUnit,
          description: item.description,
          unlimitedShelfLife: item.unlimitedShelfLife,
          shelfLife: item.shelfLife,
          shelfLifeUnit: item.shelfLifeUnit
        }
      };
    });

    return c.json({
      success: true,
      data: {
        order: order,
        items: items
      }
    })
  } catch (err: any) {
    console.error('Error fetching order details:', err)
    return c.json({
      success: false,
      error: err.message
    }, 500)
  }
})

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

    console.log('Creating new order with data:', { 
      customer_id, 
      order_date, 
      required_date, 
      total_amount, 
      status,
      order_items_count: order_items?.length || 0 
    });

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
    console.log(`Created order with ID: ${orderId}`);
    
    // Insert order items
    if (order_items && Array.isArray(order_items) && order_items.length > 0) {
      console.log(`Processing ${order_items.length} order items`);
      
      for (const item of order_items) {
        const { product_id, requested_quantity, unit_price } = item
        
        // Get current inventory
        const inventoryResult = await DB.prepare(`
          SELECT quantity_available FROM inventory WHERE product_id = ?
        `).bind(product_id).first()
        
        console.log(`Inventory check for product ${product_id}:`, inventoryResult);
        
        let fulfilledQuantity = requested_quantity
        let remainingQuantity = 0
        let status = 'completed'
        let systemNote = null
        
        // Check if inventory is sufficient
        if (inventoryResult && inventoryResult.quantity_available < requested_quantity) {
          fulfilledQuantity = inventoryResult.quantity_available || 0
          remainingQuantity = requested_quantity - fulfilledQuantity
          status = 'pending'
          systemNote = `Insufficient inventory. Requested: ${requested_quantity}, Available: ${fulfilledQuantity}, Shortage: ${remainingQuantity}`
        } else if (!inventoryResult) {
          // No inventory record found for this product
          fulfilledQuantity = 0
          remainingQuantity = requested_quantity
          status = 'pending'
          systemNote = `No inventory record found for this product`
        }
        
        console.log(`Creating order item with status: ${status}, system note: ${systemNote}`);
        
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
        
        // Update inventory if items were fulfilled
        if (fulfilledQuantity > 0 && inventoryResult) {
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

export default orders
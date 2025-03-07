// test-order-creator.js
// Use fetch API to send requests to the backend API for creating new orders

// Configuration
const API_URL = 'https://farmable-backend.yourdomain.workers.dev'; // Replace with your actual API URL

// Generate random customer data
function generateRandomCustomer() {
  const names = ['Restaurant A', 'Restaurant B', 'Hotel C', 'Cafe D', 'School Cafeteria E', 'Hospital F'];
  const randomName = names[Math.floor(Math.random() * names.length)];
  const email = `${randomName.toLowerCase().replace(/\s/g, '')}@example.com`;
  
  return {
    name: randomName,
    email: email,
    phone: `13${Math.floor(Math.random() * 1000000000).toString().padStart(9, '0')}`
  };
}

// Generate random product IDs (assuming product IDs are between 1-10)
function getRandomProductIds(count = 3) {
  const productIds = [];
  for (let i = 0; i < count; i++) {
    productIds.push(Math.floor(Math.random() * 10) + 1);
  }
  return [...new Set(productIds)]; // Remove duplicates
}

// Generate random order items
function generateOrderItems(productIds) {
  return productIds.map(productId => {
    const requestedQuantity = Math.floor(Math.random() * 50) + 5; // Random number between 5-55
    const unitPrice = (Math.random() * 20 + 5).toFixed(2); // Random price between 5-25
    
    return {
      product_id: productId,
      requested_quantity: requestedQuantity,
      unit_price: unitPrice
    };
  });
}

// Calculate total amount
function calculateTotalAmount(orderItems) {
  return orderItems.reduce((total, item) => {
    return total + (item.requested_quantity * item.unit_price);
  }, 0).toFixed(2);
}

// Generate random future date (today to 30 days ahead)
function getRandomFutureDate(daysAhead = 30) {
  const today = new Date();
  const futureDate = new Date();
  futureDate.setDate(today.getDate() + Math.floor(Math.random() * daysAhead) + 1);
  return futureDate.toISOString().split('T')[0];
}

// Create a new order
async function createNewOrder() {
  try {
    // 1. Generate/get a random customer
    const customer = generateRandomCustomer();
    
    // 2. Check if customer exists, create if not
    let customerId;
    try {
      const checkCustomerResponse = await fetch(`${API_URL}/api/customers?email=${customer.email}`);
      const customerData = await checkCustomerResponse.json();
      
      if (customerData.data && customerData.data.length > 0) {
        customerId = customerData.data[0].customer_id;
      } else {
        // Create a new customer
        const createCustomerResponse = await fetch(`${API_URL}/api/customers`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(customer)
        });
        const newCustomer = await createCustomerResponse.json();
        customerId = newCustomer.id;
      }
    } catch (error) {
      console.error('Error handling customer:', error);
      return;
    }
    
    // 3. Create order data
    const productIds = getRandomProductIds();
    const orderItems = generateOrderItems(productIds);
    const totalAmount = calculateTotalAmount(orderItems);
    const requiredDate = getRandomFutureDate();
    
    const orderData = {
      customer_id: customerId,
      order_date: new Date().toISOString().split('T')[0], // Today's date
      required_date: requiredDate,
      total_amount: totalAmount,
      status: 'pending',
      order_items: orderItems
    };
    
    // 4. Send the create order request
    const createOrderResponse = await fetch(`${API_URL}/api/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(orderData)
    });
    
    const result = await createOrderResponse.json();
    
    if (result.success) {
      console.log(`Order created successfully! Order ID: ${result.id}`);
      return result.id;
    } else {
      console.error('Failed to create order:', result.error);
      return null;
    }
  } catch (error) {
    console.error('Error during order creation process:', error);
    return null;
  }
}

// Execute order creation
createNewOrder()
  .then(orderId => {
    if (orderId) {
      console.log('Order creation complete, page will automatically refresh to show the new order');
    }
  })
  .catch(error => {
    console.error('Execution error:', error);
  });
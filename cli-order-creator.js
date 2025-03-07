// cli-order-creator.js
// A command-line tool for creating orders manually - ES Module version

import { createReadStream } from 'fs';
import { createInterface } from 'readline';
import fetch from 'node-fetch'; // You may need to install this: npm install node-fetch

// Configuration
const API_URL = 'https://farmable-backend.xchen83.workers.dev'; // Replace with your actual API URL

// Create readline interface for user input
const rl = createInterface({
  input: process.stdin,
  output: process.stdout
});

// Promisify the question function
function question(query) {
  return new Promise(resolve => {
    rl.question(query, resolve);
  });
}

// Main function
async function main() {
  console.log('===== Order Creation Tool =====');
  console.log('This tool will guide you through creating a new order.');
  console.log('Press Ctrl+C at any time to cancel.');
  console.log('===============================\n');

  try {
    // 1. Customer information
    console.log('--- Customer Information ---');
    let customerId = null;
    const customerChoice = await question('Do you want to: (1) Use existing customer (2) Create new customer: ');
    
    if (customerChoice === '1') {
      // Use existing customer
      const customerEmail = await question('Enter customer email: ');
      const response = await fetch(`${API_URL}/api/customers?email=${encodeURIComponent(customerEmail)}`);
      const result = await response.json();
      
      if (result.success && result.data && result.data.length > 0) {
        customerId = result.data[0].customer_id;
        console.log(`Customer found: ${result.data[0].name} (ID: ${customerId})`);
      } else {
        console.log('Customer not found with that email. Let\'s create a new one.');
        customerId = await createNewCustomer();
      }
    } else {
      // Create new customer
      customerId = await createNewCustomer();
    }
    
    // 2. Order details
    console.log('\n--- Order Details ---');
    const orderDate = await question('Order date (YYYY-MM-DD, leave blank for today): ');
    const requiredDate = await question('Required delivery date (YYYY-MM-DD): ');
    
    // 3. Order items
    console.log('\n--- Order Items ---');
    const orderItems = [];
    let addingItems = true;
    
    while (addingItems) {
      // Display available products
      console.log('\nAvailable Products:');
      const productsResponse = await fetch(`${API_URL}/api/products`);
      const productsResult = await productsResponse.json();
      
      if (productsResult.success && productsResult.data) {
        productsResult.data.forEach(product => {
          console.log(`ID: ${product.product_id}, Name: ${product.productName}, Unit: ${product.packUnit}`);
        });
      } else {
        console.log('Failed to fetch products. Please check your API connection.');
        return;
      }
      
      // Add item
      const productId = await question('Enter product ID: ');
      const quantity = await question('Enter quantity: ');
      const unitPrice = await question('Enter unit price (leave blank to use default): ');
      
      // Get default price if needed
      let finalUnitPrice = unitPrice;
      if (!unitPrice || unitPrice.trim() === '') {
        // You could fetch the default price from your API here
        finalUnitPrice = (Math.random() * 10 + 5).toFixed(2); // Placeholder: random price between 5-15
        console.log(`Using default price: $${finalUnitPrice}`);
      }
      
      orderItems.push({
        product_id: parseInt(productId),
        requested_quantity: parseFloat(quantity),
        unit_price: parseFloat(finalUnitPrice)
      });
      
      const addMore = await question('Add another item? (y/n): ');
      addingItems = addMore.toLowerCase() === 'y';
    }
    
    // 4. Calculate total amount
    const totalAmount = orderItems.reduce((sum, item) => {
      return sum + (item.requested_quantity * item.unit_price);
    }, 0).toFixed(2);
    
    console.log(`\nTotal order amount: $${totalAmount}`);
    
    // 5. Confirm and submit order
    const confirm = await question('\nCreate this order? (y/n): ');
    
    if (confirm.toLowerCase() === 'y') {
      // Prepare order data
      const orderData = {
        customer_id: customerId,
        order_date: orderDate || new Date().toISOString().split('T')[0],
        required_date: requiredDate,
        total_amount: totalAmount,
        status: 'pending',
        order_items: orderItems
      };
      
      // Submit order
      const createOrderResponse = await fetch(`${API_URL}/api/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(orderData)
      });
      
      const result = await createOrderResponse.json();
      
      if (result.success) {
        console.log(`\nOrder created successfully! Order ID: ${result.id}`);
      } else {
        console.error(`\nFailed to create order: ${result.error}`);
      }
    } else {
      console.log('\nOrder creation cancelled.');
    }
  } catch (error) {
    console.error('An error occurred:', error);
  } finally {
    rl.close();
  }
}

// Function to create a new customer
async function createNewCustomer() {
  console.log('\nCreating a new customer:');
  const name = await question('Enter customer name: ');
  const email = await question('Enter customer email: ');
  const phone = await question('Enter customer phone: ');
  
  const customerData = {
    name,
    email,
    phone
  };
  
  try {
    const response = await fetch(`${API_URL}/api/customers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(customerData)
    });
    
    const result = await response.json();
    
    if (result.success) {
      console.log(`Customer created successfully! ID: ${result.id}`);
      return result.id;
    } else {
      console.error(`Failed to create customer: ${result.error}`);
      throw new Error('Customer creation failed');
    }
  } catch (error) {
    console.error('Error creating customer:', error);
    throw error;
  }
}

// Run the main function
main().catch(console.error);
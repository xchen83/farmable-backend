// order-scheduler.js
// Periodically generate test orders to demonstrate real-time functionality

const API_URL = 'https://farmable-backend.yourdomain.workers.dev'; // Replace with your actual API URL
const TEST_ORDER_CREATOR_PATH = './test-order-creator.js'; // Path to the test order creator script

// Import required dependencies
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration section
const DELAY_BETWEEN_ORDERS = 2 * 60 * 1000; // 2 minutes between orders
const BUSINESS_HOURS = {
  start: 9, // Start at 9 AM
  end: 21   // End at 9 PM
};
const ACTIVE_DAYS = [1, 2, 3, 4, 5]; // Monday to Friday (0 is Sunday, 1 is Monday, etc.)

// Check if current time is within business hours
function isBusinessHours() {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const hour = now.getHours();
  
  // Check if it's a workday
  if (!ACTIVE_DAYS.includes(dayOfWeek)) {
    return false;
  }
  
  // Check if it's within business hours
  return hour >= BUSINESS_HOURS.start && hour < BUSINESS_HOURS.end;
}

// Create an order
function createOrder() {
  try {
    console.log(`[${new Date().toLocaleString()}] Creating new order...`);
    
    // Execute the order creation script
    const scriptPath = path.resolve(__dirname, TEST_ORDER_CREATOR_PATH);
    
    if (fs.existsSync(scriptPath)) {
      const result = execSync(`node ${scriptPath}`, { encoding: 'utf8' });
      console.log(result);
    } else {
      console.error(`Order creation script does not exist: ${scriptPath}`);
    }
  } catch (error) {
    console.error('Error creating order:', error);
  }
  
  // Schedule the next order creation
  scheduleNextOrder();
}

// Schedule the next order creation
function scheduleNextOrder() {
  // If not within business hours, schedule for the start of the next business day
  if (!isBusinessHours()) {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(now.getDate() + 1);
    tomorrow.setHours(BUSINESS_HOURS.start, 0, 0, 0);
    
    // If tomorrow is not a business day, keep looking for the next business day
    while (!ACTIVE_DAYS.includes(tomorrow.getDay())) {
      tomorrow.setDate(tomorrow.getDate() + 1);
    }
    
    const timeToNextBusiness = tomorrow.getTime() - now.getTime();
    console.log(`[${now.toLocaleString()}] Outside business hours, next order will be created at ${tomorrow.toLocaleString()}`);
    
    setTimeout(createOrder, timeToNextBusiness);
    return;
  }
  
  // Within business hours, create the next order after the specified delay
  console.log(`[${new Date().toLocaleString()}] Next order will be created in ${DELAY_BETWEEN_ORDERS/1000/60} minutes`);
  setTimeout(createOrder, DELAY_BETWEEN_ORDERS);
}

// Start the scheduler
console.log(`[${new Date().toLocaleString()}] Order scheduler started`);
scheduleNextOrder();

// Add an infinite loop to prevent the script from exiting
setInterval(() => {}, 60000);
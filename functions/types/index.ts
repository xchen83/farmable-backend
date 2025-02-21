/// <reference types="@cloudflare/workers-types" />

export interface Product {
  product_id: number;
  productName: string;
  category: string;
  shelfLife: number | null;
  shelfLifeUnit: string | null;
  unlimitedShelfLife: boolean;
  packUnit: string;
  description: string | null;
  productImage: string | null;
}

export interface Order {
  order_id: number;
  customer_id: number;
  order_date: string;
  required_date: string;
  total_amount: number;
  status: string;
  customer_name?: string;
  transaction_count?: number;
}

export interface OrderItem {
  order_item_id: number;
  order_id: number;
  product_id: number;
  requested_quantity: number;
  fulfilled_quantity: number;
  remaining_quantity: number;
  unit_price: number;
  status: string;
  system_note: string | null;
  product_name?: string;
  packUnit?: string;
}

export interface Customer {
  customer_id: number;
  name: string;
  email: string;
  phone: string | null;
  total_spent: number;
  transaction_count: number;
  last_transaction_date: string | null;
}

export interface Env {
  DB: D1Database;
  [key: string]: unknown;
}

export interface Bindings {
  DB: D1Database;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T | null;
  error?: string;
  details?: string;
} 
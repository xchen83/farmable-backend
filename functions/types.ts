export interface Env {
    DB: D1Database;
}

export type Product = {
    product_id: number;
    productName: string;
    category: string;
    packUnit: string;
    unlimitedShelfLife: boolean;
    description?: string;
    productImage?: string;
}

export type Customer = {
    customer_id: number;
    name: string;
    email: string;
    phone?: string;
    total_spent: number;
    transaction_count: number;
    last_transaction_date?: string;
    created_at: string;
}

export type Order = {
    order_id: number;
    customer_id: number;
    order_date: string;
    required_date: string;
    total_amount: number;
    status: string;
    customer_name?: string;
}

export type OrderItem = {
    order_item_id: number;
    order_id: number;
    product_id: number;
    requested_quantity: number;
    fulfilled_quantity?: number;
    remaining_quantity?: number;
    unit_price: number;
    status: string;
    system_note?: string;
    product_name?: string;
    packUnit?: string;
}

export type ApiResponse<T> = {
    success: boolean;
    data?: T;
    error?: string;
    details?: string;
} 
import { D1Database } from '@cloudflare/workers-types';

// Define the Product interface
interface Product {
  id?: number;
  productName: string;
  category: string;
  shelfLife?: number | null;
  shelfLifeUnit?: string | null;
  unlimitedShelfLife: boolean;
  packUnit: string;
  description?: string;
  productImage?: string;
}

// Define the Env interface
interface Env {
  DB: D1Database;
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  if (request.method === "OPTIONS") {
    return new Response(null, {
      headers: corsHeaders
    });
  }

  try {
    if (request.method === "GET") {
      const products = await env.DB.prepare(
        "SELECT * FROM products"
      ).all();

      return Response.json(products.results, {
        headers: corsHeaders
      });
    }

    if (request.method === "POST") {
      const body = await request.json() as Product;  // Fixed typo from 'Poduct' to 'Product'

      const result = await env.DB.prepare(
        "INSERT INTO products (productName, category, shelfLife, shelfLifeUnit, unlimitedShelfLife, packUnit, description, productImage) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
      )
        .bind(
          body.productName,
          body.category,
          body.shelfLife,
          body.shelfLifeUnit,
          body.unlimitedShelfLife ? 1 : 0,
          body.packUnit,
          body.description,
          body.productImage
        )
        .run();

      return Response.json({
        success: true,
        id: result.meta.last_row_id
      }, {
        headers: corsHeaders
      });
    }

  } catch (error) {
    console.error("Server error:", error);
    return Response.json(
      { error: error instanceof Error ? error.message : 'Unknown error occurred' },
      {
        status: 500,
        headers: corsHeaders
      }
    );
  }

  return new Response('Method not allowed', {
    status: 405,
    headers: corsHeaders
  });
};
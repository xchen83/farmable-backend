import { D1Database, D1Result } from '@cloudflare/workers-types';

// Define the Product interface
interface Product {
  id?: number;
  name: string;
  price: number;
  description: string;
}


interface Env {
  DB: D1Database;
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  // Handle CORS
  if (request.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  }

  try {
    if (request.method === "GET") {
      const products = await env.DB.prepare(
        "SELECT * FROM products"
      ).all();

      return Response.json(products.results, {
        headers: {
          "Access-Control-Allow-Origin": "*",
        },
      });
    }

    if (request.method === "POST") {
      const body = await request.json() as Product;
      const { name, price, description } = body;

      const result = await env.DB.prepare(
        "INSERT INTO products (name, price, description) VALUES (?, ?, ?)"
      )
        .bind(name, price, description)
        .run();

      return Response.json({ success: true, id: result.meta.last_row_id }, {
        headers: {
          "Access-Control-Allow-Origin": "*",
        },
      });
    }

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return Response.json({ error: errorMessage }, {
      status: 500,
      headers: {
        "Access-Control-Allow-Origin": "*",
      },
    });
  }

  return new Response('Method not allowed', { status: 405 });
}
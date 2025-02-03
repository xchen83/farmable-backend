import { Product, Env, ApiResponse } from '../types';
import { corsHeaders, handleOptions, createResponse } from '../utils/cors';

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext) {
    // Handle CORS preflight
    if (request.method === "OPTIONS") {
      return handleOptions();
    }

    try {
      switch (request.method) {
        case "POST":
          return await handlePostRequest(request, env);
        case "GET":
          return await handleGetRequest(env);
        default:
          return createResponse<ApiResponse<null>>({
            success: false,
            error: "Method not allowed"
          }, 405);
      }
    } catch (error) {
      console.error("Error:", error);
      return createResponse<ApiResponse<null>>({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred",
        details: JSON.stringify(error)
      }, 500);
    }
  }
};

async function handlePostRequest(request: Request, env: Env) {
  const body = await request.json() as Product;
  console.log('Received POST data:', body);

  // Validate required fields
  if (!isValidProduct(body)) {
    return createResponse<ApiResponse<Product>>({
      success: false,
      error: "Missing required fields",
      details: JSON.stringify(body)
    }, 400);
  }

  const result = await insertProduct(env.DB, body);

  if (!result.success) {
    return createResponse<ApiResponse<null>>({
      success: false,
      error: "Failed to insert product"
    }, 500);
  }

  const newProduct = await getProductById(env.DB, result.id);

  if (!newProduct) {
    return createResponse<ApiResponse<null>>({
      success: false,
      error: "Failed to retrieve created product"
    }, 500);
  }

  return createResponse<ApiResponse<Product>>({
    success: true,
    data: newProduct
  });
}

async function handleGetRequest(env: Env) {
  const { results } = await env.DB.prepare(
    "SELECT * FROM products ORDER BY id DESC"
  ).all<Product>();

  return createResponse<Product[]>(results);
}

async function insertProduct(db: D1Database, product: Product) {
  const stmt = db.prepare(`
    INSERT INTO products (
      productName,
      category,
      shelfLife,
      shelfLifeUnit,
      unlimitedShelfLife,
      packUnit,
      description,
      productImage
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const result = await stmt.bind(
    product.productName.trim(),
    product.category.trim(),
    product.unlimitedShelfLife ? null : product.shelfLife,
    product.unlimitedShelfLife ? null : product.shelfLifeUnit,
    product.unlimitedShelfLife ? 1 : 0,
    product.packUnit.trim(),
    product.description?.trim() || null,
    product.productImage || null
  ).run();

  return {
    success: result.success,
    id: result.meta?.last_row_id
  };
}

async function getProductById(db: D1Database, id: number | undefined): Promise<Product | null> {
  if (!id) return null;

  const result = await db.prepare(
    "SELECT * FROM products WHERE id = ?"
  ).bind(id).first<Product>();

  return result || null;
}

function isValidProduct(product: Product): boolean {
  return !!(
    product.productName &&
    product.category &&
    product.packUnit
  );
}
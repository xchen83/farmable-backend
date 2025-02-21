import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { Product, Env, ApiResponse } from '../types';
import { corsHeaders, handleOptions, createResponse } from '../utils/cors';

// Define types
type Bindings = {
  DB: D1Database;
}

type Variables = {
  // Add any variables you need
}

const products = new Hono<{ Bindings: Bindings, Variables: Variables }>()

// Enable CORS for frontend access
products.use('/*', cors({
  origin: ['http://localhost:4200', 'https://farmable.pages.dev', 'https://2e34836e.farmable.pages.dev'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}))

// GET all products
products.get('/', async (c) => {
  try {
    const { DB } = c.env
    const result = await DB.prepare(`
      SELECT * FROM products 
      ORDER BY product_id DESC
    `).all()
    return c.json({ success: true, data: result.results })
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 500)
  }
})

// POST new product
products.post('/', async (c) => {
  try {
    const { DB } = c.env
    const body = await c.req.json()
    const { productName, category, packUnit, description } = body

    const result = await DB.prepare(`
      INSERT INTO products (productName, category, packUnit, description)
      VALUES (?, ?, ?, ?)
    `).bind(productName, category, packUnit, description).run()

    return c.json({ success: true, id: result.meta.last_row_id })
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 500)
  }
})

// PUT update product
products.put('/:id', async (c) => {
  try {
    const { DB } = c.env
    const id = c.req.param('id')
    const body = await c.req.json()
    const { productName, category, packUnit, description } = body

    await DB.prepare(`
      UPDATE products 
      SET productName = ?, category = ?, packUnit = ?, description = ?
      WHERE product_id = ?
    `).bind(productName, category, packUnit, description, id).run()

    return c.json({ success: true })
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 500)
  }
})

// DELETE product
products.delete('/:id', async (c) => {
  try {
    const { DB } = c.env
    const id = c.req.param('id')
    await DB.prepare('DELETE FROM products WHERE product_id = ?').bind(id).run()
    return c.json({ success: true })
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 500)
  }
})

export default products

// Add these function definitions before the main export
async function handleGetRequest(env: Env) {
  console.log('Executing GET request');
  const { results } = await env.DB.prepare(
    "SELECT * FROM products ORDER BY id DESC"
  ).all<Product>();

  return createResponse<Product[]>(results);
}

function isValidProduct(product: Product): boolean {
  return !!(
    product.productName &&
    product.category &&
    product.packUnit
  );
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

async function handleDeleteRequest(env: Env, id: number) {
  try {
    console.log('Attempting to delete product:', id);

    // First check if product exists
    const product = await getProductById(env.DB, id);
    if (!product) {
      return createResponse<ApiResponse<null>>({
        success: false,
        error: "Product not found"
      }, 404);
    }

    // Delete the product
    const result = await env.DB.prepare(
      'DELETE FROM products WHERE id = ?'
    ).bind(id).run();

    if (!result.success) {
      return createResponse<ApiResponse<null>>({
        success: false,
        error: "Failed to delete product"
      }, 500);
    }

    return createResponse<ApiResponse<null>>({
      success: true,
      data: null
    });
  } catch (error) {
    console.error('Error deleting product:', error);
    return createResponse<ApiResponse<null>>({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    }, 500);
  }
}

async function handleUpdateRequest(request: Request, env: Env, id: number) {
  try {
    console.log('Attempting to update product:', id);

    // First check if product exists
    const existingProduct = await getProductById(env.DB, id);
    if (!existingProduct) {
      return createResponse<ApiResponse<null>>({
        success: false,
        error: "Product not found"
      }, 404);
    }

    const product = await request.json() as Product;
    console.log('Update data:', product);

    const result = await env.DB.prepare(`
      UPDATE products 
      SET productName = ?,
          category = ?,
          shelfLife = ?,
          shelfLifeUnit = ?,
          unlimitedShelfLife = ?,
          packUnit = ?,
          description = ?,
          productImage = ?
      WHERE id = ?
    `).bind(
      product.productName.trim(),
      product.category.trim(),
      product.unlimitedShelfLife ? null : product.shelfLife,
      product.unlimitedShelfLife ? null : product.shelfLifeUnit,
      product.unlimitedShelfLife ? 1 : 0,
      product.packUnit.trim(),
      product.description?.trim() || null,
      product.productImage || null,
      id
    ).run();

    if (!result.success) {
      console.error('Update failed:', result);
      return createResponse<ApiResponse<null>>({
        success: false,
        error: "Failed to update product"
      }, 500);
    }

    const updatedProduct = await getProductById(env.DB, id);
    console.log('Updated product:', updatedProduct);

    return createResponse<ApiResponse<Product>>({
      success: true,
      data: updatedProduct
    });
  } catch (error) {
    console.error('Error updating product:', error);
    return createResponse<ApiResponse<null>>({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    }, 500);
  }
}

// Your existing handlePostRequest function stays the same
async function handlePostRequest(request: Request, env: Env) {
  try {
    console.log('Starting POST request handling');
    console.log('Database connection status:', !!env.DB);

    const body = await request.json() as Product;
    console.log('Parsed request body:', body);

    if (!isValidProduct(body)) {
      console.log('Product validation failed:', {
        hasName: !!body.productName,
        hasCategory: !!body.category,
        hasPackUnit: !!body.packUnit
      });
      return createResponse<ApiResponse<Product>>({
        success: false,
        error: "Missing required fields",
        details: JSON.stringify(body)
      }, 400);
    }

    console.log('Product validation passed, attempting insert');
    const result = await insertProduct(env.DB, body);
    console.log('Insert operation result:', result);

    if (!result.success) {
      console.error('Insert operation failed:', result);
      return createResponse<ApiResponse<null>>({
        success: false,
        error: "Failed to insert product",
        details: JSON.stringify(result)
      }, 500);
    }

    console.log('Insert successful, retrieving new product');
    const newProduct = await getProductById(env.DB, result.id);
    console.log('Retrieved product:', newProduct);

    if (!newProduct) {
      console.error('Failed to retrieve newly created product');
      return createResponse<ApiResponse<null>>({
        success: false,
        error: "Failed to retrieve created product"
      }, 500);
    }

    return createResponse<ApiResponse<Product>>({
      success: true,
      data: newProduct
    });
  } catch (error) {
    console.error('Detailed error in handlePostRequest:', {
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
      error
    });
    throw error;
  }
}
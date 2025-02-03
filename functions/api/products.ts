interface Env {
  DB: D1Database;
}

interface Product {
  productName: string;
  category: string;
  shelfLife: number | null;
  shelfLifeUnit: string | null;
  unlimitedShelfLife: boolean;
  packUnit: string;
  description: string | null;
  productImage: string | null;
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };

  if (request.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // POST request - add new product
    if (request.method === "POST") {
      const body = await request.json() as Product;

      // Validate required fields
      if (!body.productName || !body.category || !body.packUnit) {
        return Response.json({
          success: false,
          error: "Missing required fields"
        }, {
          status: 400,
          headers: corsHeaders
        });
      }

      // Prepare the insert statement
      const stmt = env.DB.prepare(`
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

      // Execute the insert
      const result = await stmt.bind(
        body.productName.trim(),
        body.category.trim(),
        body.unlimitedShelfLife ? null : body.shelfLife,
        body.unlimitedShelfLife ? null : body.shelfLifeUnit,
        body.unlimitedShelfLife ? 1 : 0,
        body.packUnit.trim(),
        body.description?.trim() || null,
        body.productImage || null
      ).run();

      // Log the result for debugging
      console.log("Insert result:", {
        success: result.success,
        lastRowId: result.meta?.last_row_id
      });

      // Fetch the newly inserted product
      const newProduct = await env.DB.prepare(
        "SELECT * FROM products WHERE id = ?"
      ).bind(result.meta?.last_row_id).first();

      // Fetch all products
      const allProducts = await env.DB.prepare(
        "SELECT * FROM products ORDER BY id DESC"
      ).all();

      return Response.json({
        success: true,
        message: "Product added successfully",
        newProduct,
        allProducts: allProducts.results
      }, {
        headers: corsHeaders
      });
    }

    // GET request - fetch all products
    if (request.method === "GET") {
      const products = await env.DB.prepare(
        "SELECT * FROM products ORDER BY id DESC"
      ).all();

      return Response.json(products.results, {
        headers: corsHeaders
      });
    }

  } catch (error) {
    console.error("Error:", error);
    return Response.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
      details: JSON.stringify(error)
    }, {
      status: 500,
      headers: corsHeaders
    });
  }

  return new Response("Method not allowed", {
    status: 405,
    headers: corsHeaders
  });
};
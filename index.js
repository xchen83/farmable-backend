export default {
  async fetch(request, env) {
    const { results } = await env.DB.prepare(
  "SELECT * FROM products"
).all();
return Response.json(results);

  },
};
import { onRequest as __api_products_ts_onRequest } from "/Users/xuan/Desktop/MSTI/2025 Winter/TECHIN 542/Farmable Web App/farmable-backend/functions/api/products.ts"

export const routes = [
    {
      routePath: "/api/products",
      mountPath: "/api",
      method: "",
      middlewares: [],
      modules: [__api_products_ts_onRequest],
    },
  ]
import api from "./api";

export const getDashboardData = async () => {
  const [productsResponse, posResponse, budgetResponse, storageResponse] =
    await Promise.all([
      api.get("/products"),
      api.get("/pos"),
      api.get("/budget"),
      api.get("/storage"),
    ]);

  return {
    products: productsResponse.data,
    purchaseOrders: posResponse.data,
    budget: budgetResponse.data,
    storage: storageResponse.data,
  };
};
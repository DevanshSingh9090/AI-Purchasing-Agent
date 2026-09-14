import api from "./api";

export const runPurchaseRecommendation = async ({
  productId,
  recommendedQuantity,
}) => {
  const response = await api.post("/scenarios/purchase-review", {
    productId,
    recommendedQuantity,
  });

  return response.data;
};

export const runSupplierShortfall = async ({
  purchaseOrderId,
  fulfilledQuantity,
}) => {
  const response = await api.post("/scenarios/supplier-shortfall", {
    purchaseOrderId,
    fulfilledQuantity,
  });

  return response.data;
};
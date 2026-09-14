const axios = require('axios');

const BASE_URL = process.env.BASE_URL || 'http://localhost:4000';

/**
 * Gathers all evidence needed for Scenario 1: Purchase Recommendation Review.
 * @param {string} productId
 * @param {number} recommendedQty - the quantity the system is recommending (e.g. 800)
 */
async function investigatePurchaseRecommendation(productId, recommendedQty) {
  const [productRes, inventoryRes, demandRes, posRes, suppliersRes, budgetRes, storageRes] = await Promise.all([
    axios.get(`${BASE_URL}/api/products/${productId}`),
    axios.get(`${BASE_URL}/api/inventory/${productId}`),
    axios.get(`${BASE_URL}/api/demand/${productId}`),
    axios.get(`${BASE_URL}/api/pos/${productId}`),
    axios.get(`${BASE_URL}/api/suppliers/${productId}`),
    axios.get(`${BASE_URL}/api/budget`),
    axios.get(`${BASE_URL}/api/storage`),
  ]);

  const product = productRes.data;
  const inventoryRecords = inventoryRes.data;
  const totalAvailable = inventoryRecords.reduce((sum, r) => sum + (r.availableQuantity ?? 0), 0);
  const openPOs = posRes.data;
  const totalOpenPOQty = openPOs.reduce((sum, po) => sum + (po.quantityConfirmed ?? po.quantityOrdered ?? 0), 0);
  const demand = demandRes.data;
  const suppliers = suppliersRes.data;
  const budget = budgetRes.data;
  const storage = storageRes.data;

  const viableSuppliers = suppliers.filter(s => recommendedQty >= (s.minimumOrderQty ?? 0));
  const chosenSupplier = [...viableSuppliers].sort((a, b) => a.leadTimeDays - b.leadTimeDays)[0] || suppliers[0];

  const estimatedCost = recommendedQty * (product.unitCost || 0);
  const remainingBudget = budget.totalBudget - budget.spentSoFar;
  const remainingStorage = storage.totalCapacity - storage.usedCapacity;
  const estimatedStorageNeeded = recommendedQty * (product.storageUnitsPerItem || 0);

  return {
    productId,
    productName: product.name,
    recommendedQty,
    estimatedCost,
    inventory: {
      totalAvailable,
      records: inventoryRecords,
    },
    demandForecast: demand,
    openPOs: {
      totalOpenPOQty,
      records: openPOs,
    },
    suppliers,
    chosenSupplier,
    budget: {
      totalBudget: budget.totalBudget,
      spentSoFar: budget.spentSoFar,
      remainingBudget,
    },
    storage: {
      totalCapacity: storage.totalCapacity,
      usedCapacity: storage.usedCapacity,
      remainingStorage,
      estimatedStorageNeeded,
    },
    existingSupplyVsDemand: {
      existingSupply: totalAvailable + totalOpenPOQty,
      expectedDemand: demand.expectedDemand,
      gap: demand.expectedDemand - (totalAvailable + totalOpenPOQty),
    },
  };
}

module.exports = { investigatePurchaseRecommendation };
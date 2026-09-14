const axios = require('axios');
const BASE_URL = process.env.BASE_URL || 'http://localhost:4000';

/**
 * Gathers evidence for Scenario 2: Supplier Cannot Fulfil the Purchase.
 * @param {string} poId - the existing PO whose supplier reported a shortfall
 * @param {number} fulfilledQty - how much the supplier says they can actually deliver
 */
async function investigateSupplierShortfall(poId, fulfilledQty) {
  const poRes = await axios.get(`${BASE_URL}/api/pos/po/${poId}`);
  const po = poRes.data;

  const [productRes, inventoryRes, demandRes, suppliersRes, budgetRes, storageRes] = await Promise.all([
    axios.get(`${BASE_URL}/api/products/${po.productId}`),
    axios.get(`${BASE_URL}/api/inventory/${po.productId}`),
    axios.get(`${BASE_URL}/api/demand/${po.productId}`),
    axios.get(`${BASE_URL}/api/suppliers/${po.productId}`),
    axios.get(`${BASE_URL}/api/budget`),
    axios.get(`${BASE_URL}/api/storage`),
  ]);

  const product = productRes.data;
  const inventoryRecords = inventoryRes.data;
  const totalAvailable = inventoryRecords.reduce((sum, r) => sum + (r.availableQuantity ?? 0), 0);
  const demand = demandRes.data;
  const suppliers = suppliersRes.data;
  const budget = budgetRes.data;
  const storage = storageRes.data;

  const shortfallQty = po.quantityOrdered - fulfilledQty;

  const originalSupplier = suppliers.find(s => String(s._id) === String(po.supplierId)) || null;
  const alternateSuppliers = suppliers.filter(s => String(s._id) !== String(po.supplierId));
  const bestAlternate = [...alternateSuppliers].sort((a, b) => a.leadTimeDays - b.leadTimeDays)[0] || null;

  const remainingBudget = budget.totalBudget - budget.spentSoFar;
  const remainingStorage = storage.totalCapacity - storage.usedCapacity;

  return {
    poId,
    productId: po.productId,
    productName: product.name,
    originalPO: po,
    fulfilledQty,
    shortfallQty,
    originalSupplier,
    alternateSuppliers,
    bestAlternate,
    inventory: { totalAvailable, records: inventoryRecords },
    demandForecast: demand,
    budget: { totalBudget: budget.totalBudget, spentSoFar: budget.spentSoFar, remainingBudget },
    storage: { totalCapacity: storage.totalCapacity, usedCapacity: storage.usedCapacity, remainingStorage },
    estimatedCostPerUnit: product.unitCost || 0,
    estimatedStoragePerUnit: product.storageUnitsPerItem || 0,
    // After the shortfall, does inventory + what's actually confirmed still cover demand?
    coverageAfterShortfall: {
      existingSupply: totalAvailable + fulfilledQty,
      expectedDemand: demand.expectedDemand,
      gap: demand.expectedDemand - (totalAvailable + fulfilledQty),
    },
  };
}

module.exports = { investigateSupplierShortfall };
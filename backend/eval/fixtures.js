// Fixture helpers for the eval harness. Everything this file creates is tagged with the
// EVAL_TAG prefix so cleanupEvalFixtures() can remove it safely without touching the real
// seed.js data, and every run uses a fresh Date.now() suffix so repeated `npm run eval`
// runs never collide on a unique `sku` index.

const Product = require('../src/models/Product');
const Inventory = require('../src/models/Inventory');
const Supplier = require('../src/models/Supplier');
const DemandForecast = require('../src/models/DemandForecast');
const Budget = require('../src/models/Budget');
const StorageCapacity = require('../src/models/StorageCapacity');
const PurchaseOrder = require('../src/models/PurchaseOrder');

const EVAL_TAG = 'EVAL-';

async function withTightBudget(overrides, fn) {
  const original = await Budget.findOne().sort({ periodStart: -1 });
  const snapshot = original ? original.toObject() : null;
  try {
    if (original) {
      original.totalBudget = overrides.totalBudget;
      original.spentSoFar = overrides.spentSoFar;
      await original.save();
    } else {
      await Budget.create({
        periodStart: new Date(),
        periodEnd: new Date(Date.now() + 30 * 86400000),
        ...overrides,
      });
    }
    return await fn();
  } finally {
    if (snapshot) {
      await Budget.findByIdAndUpdate(snapshot._id, {
        totalBudget: snapshot.totalBudget,
        spentSoFar: snapshot.spentSoFar,
      });
    }
  }
}

async function withTightStorage(overrides, fn) {
  const original = await StorageCapacity.findOne().sort({ createdAt: -1 });
  const snapshot = original ? original.toObject() : null;
  try {
    if (original) {
      original.totalCapacity = overrides.totalCapacity;
      original.usedCapacity = overrides.usedCapacity;
      await original.save();
    } else {
      await StorageCapacity.create(overrides);
    }
    return await fn();
  } finally {
    if (snapshot) {
      await StorageCapacity.findByIdAndUpdate(snapshot._id, {
        totalCapacity: snapshot.totalCapacity,
        usedCapacity: snapshot.usedCapacity,
      });
    }
  }
}

async function createProductFixture({
  skuSuffix, unitCost, storageUnitsPerItem, availableQty, reservedQty,
  expectedDemand, leadTimeDays, minimumOrderQty,
}) {
  const sku = `${EVAL_TAG}${skuSuffix}-${Date.now()}`;

  const product = await Product.create({
    sku,
    name: `Eval fixture ${skuSuffix}`,
    currentInventory: availableQty + reservedQty,
    unitCost,
    storageUnitsPerItem,
  });

  const supplier = await Supplier.create({
    name: `${EVAL_TAG}Supplier-${skuSuffix}-${Date.now()}`,
    productsSupplied: [product._id],
    leadTimeDays,
    minimumOrderQty,
    reliabilityScore: 0.8,
  });

  await Inventory.create({
    productId: product._id,
    warehouseId: 'WH-EVAL',
    currentQuantity: availableQty + reservedQty,
    reservedQuantity: reservedQty,
    availableQuantity: availableQty,
  });

  const now = new Date();
  await DemandForecast.create({
    productId: product._id,
    expectedDemand,
    periodStart: now,
    periodEnd: new Date(now.getTime() + 30 * 86400000),
  });

  return { product, supplier };
}

async function createShortfallPOFixture({
  skuSuffix, quantityOrdered, leadTimeDays, minimumOrderQty, unitCost,
  altSupplierLeadTimeDays, altSupplierMOQ,
}) {
  const { product, supplier } = await createProductFixture({
    skuSuffix,
    unitCost,
    storageUnitsPerItem: 1,
    availableQty: 20,
    reservedQty: 0,
    expectedDemand: quantityOrdered + 50,
    leadTimeDays,
    minimumOrderQty,
  });

  const altSupplier = await Supplier.create({
    name: `${EVAL_TAG}AltSupplier-${skuSuffix}-${Date.now()}`,
    productsSupplied: [product._id],
    leadTimeDays: altSupplierLeadTimeDays,
    minimumOrderQty: altSupplierMOQ,
    reliabilityScore: 0.7,
  });

  const po = await PurchaseOrder.create({
    productId: product._id,
    supplierId: supplier._id,
    quantityOrdered,
    quantityConfirmed: quantityOrdered,
    status: 'open',
    expectedDelivery: new Date(Date.now() + leadTimeDays * 86400000),
  });

  return { product, supplier, altSupplier, po };
}

async function cleanupEvalFixtures() {
  const products = await Product.find({ sku: new RegExp(`^${EVAL_TAG}`) });
  const productIds = products.map(p => p._id);

  await Promise.all([
    PurchaseOrder.deleteMany({ productId: { $in: productIds } }),
    DemandForecast.deleteMany({ productId: { $in: productIds } }),
    Inventory.deleteMany({ productId: { $in: productIds } }),
    Supplier.deleteMany({ name: new RegExp(`^${EVAL_TAG}`) }),
    Product.deleteMany({ sku: new RegExp(`^${EVAL_TAG}`) }),
  ]);
}

module.exports = {
  EVAL_TAG, withTightBudget, withTightStorage,
  createProductFixture, createShortfallPOFixture, cleanupEvalFixtures,
};
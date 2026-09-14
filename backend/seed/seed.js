require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('../src/models/Product');
const Inventory = require('../src/models/Inventory');
const Supplier = require('../src/models/Supplier');
const DemandForecast = require('../src/models/DemandForecast');
const PurchaseOrder = require('../src/models/PurchaseOrder');
const Budget = require('../src/models/Budget');
const StorageCapacity = require('../src/models/StorageCapacity');

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected. Clearing old data...');

  await Promise.all([
    Product.deleteMany({}),
    Inventory.deleteMany({}),
    Supplier.deleteMany({}),
    DemandForecast.deleteMany({}),
    PurchaseOrder.deleteMany({}),
    Budget.deleteMany({}),
    StorageCapacity.deleteMany({}),
  ]);

  // --- Products ---
  const products = await Product.insertMany([
    { sku: 'SKU-001', name: 'Wireless Mouse', currentInventory: 120, unitCost: 8, storageUnitsPerItem: 0.5 },
    { sku: 'SKU-002', name: 'USB-C Cable', currentInventory: 300, unitCost: 2, storageUnitsPerItem: 0.1 },
    { sku: 'SKU-003', name: 'Mechanical Keyboard', currentInventory: 60, unitCost: 25, storageUnitsPerItem: 1.2 },
    { sku: 'SKU-004', name: 'Laptop Stand', currentInventory: 40, unitCost: 15, storageUnitsPerItem: 1.5 },
    { sku: 'SKU-005', name: 'Webcam 1080p', currentInventory: 25, unitCost: 30, storageUnitsPerItem: 0.8 },
  ]);

  const [mouse, cable, keyboard, stand, webcam] = products;

  // --- Suppliers ---
  const suppliers = await Supplier.insertMany([
    {
      name: 'GlobalTech Supplies',
      productsSupplied: [mouse._id, cable._id, keyboard._id],
      leadTimeDays: 14,
      minimumOrderQty: 100,
      reliabilityScore: 0.9,
    },
    {
      name: 'FastTrack Electronics',
      productsSupplied: [stand._id, webcam._id],
      leadTimeDays: 7,
      minimumOrderQty: 50,
      reliabilityScore: 0.75,
    },
    {
      name: 'Backup Components Co',
      productsSupplied: [mouse._id, keyboard._id],
      leadTimeDays: 21,
      minimumOrderQty: 200,
      reliabilityScore: 0.6,
    },
  ]);

  const [globalTech, fastTrack, backupCo] = suppliers;

  // --- Inventory (per warehouse) ---
  await Inventory.insertMany([
    { productId: mouse._id, warehouseId: 'WH-1', currentQuantity: 120, reservedQuantity: 20, availableQuantity: 100 },
    { productId: cable._id, warehouseId: 'WH-1', currentQuantity: 300, reservedQuantity: 50, availableQuantity: 250 },
    { productId: keyboard._id, warehouseId: 'WH-1', currentQuantity: 60, reservedQuantity: 10, availableQuantity: 50 },
    { productId: stand._id, warehouseId: 'WH-1', currentQuantity: 40, reservedQuantity: 5, availableQuantity: 35 },
    { productId: webcam._id, warehouseId: 'WH-1', currentQuantity: 25, reservedQuantity: 5, availableQuantity: 20 },
  ]);

  // --- Demand forecasts ---
  const now = new Date();
  const periodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // +30 days

  await DemandForecast.insertMany([
    { productId: mouse._id, expectedDemand: 900, periodStart: now, periodEnd }, // deliberately high — triggers Scenario 1
    { productId: cable._id, expectedDemand: 200, periodStart: now, periodEnd },
    { productId: keyboard._id, expectedDemand: 80, periodStart: now, periodEnd },
    { productId: stand._id, expectedDemand: 30, periodStart: now, periodEnd },
    { productId: webcam._id, expectedDemand: 40, periodStart: now, periodEnd },
  ]);

  // --- Open POs (one becomes the Scenario 2 trigger) ---
  await PurchaseOrder.insertMany([
    {
      productId: mouse._id,
      supplierId: globalTech._id,
      quantityOrdered: 500,
      quantityConfirmed: 500,
      status: 'open',
      expectedDelivery: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000),
    },
    {
      productId: keyboard._id,
      supplierId: backupCo._id,
      quantityOrdered: 100,
      quantityConfirmed: 100,
      status: 'open',
      expectedDelivery: new Date(now.getTime() + 21 * 24 * 60 * 60 * 1000),
    },
  ]);

  // --- Budget ---
  await Budget.create({
    periodStart: now,
    periodEnd,
    totalBudget: 20000,
    spentSoFar: 6500,
  });

  // --- Storage capacity ---
  await StorageCapacity.create({
    totalCapacity: 1000, // storage units
    usedCapacity: 420,
  });

  console.log('Seed complete.');
  console.log({
    products: products.map(p => ({ id: p._id.toString(), sku: p.sku })),
    suppliers: suppliers.map(s => ({ id: s._id.toString(), name: s.name })),
  });

  await mongoose.disconnect();
}

seed().catch(err => {
  console.error('Seed failed:', err);
  process.exit(1);
});
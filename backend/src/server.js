require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

const inventoryRoutes = require('./routes/inventory');
const demandRoutes = require('./routes/demand');
const posRoutes = require('./routes/pos');
const suppliersRoutes = require('./routes/suppliers');
const budgetRoutes = require('./routes/budget');
const storageRoutes = require('./routes/storage');
const productsRoutes = require('./routes/products');

const app = express();
app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.use('/api/inventory', inventoryRoutes);
app.use('/api/demand', demandRoutes);
app.use('/api/pos', posRoutes);
app.use('/api/suppliers', suppliersRoutes);
app.use('/api/budget', budgetRoutes);
app.use('/api/storage', storageRoutes);
app.use('/api/products', productsRoutes);

const PORT = process.env.PORT || 4000;

connectDB().then(() => {
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
});

module.exports = app;
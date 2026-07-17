const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Kodi i Sigurisë për Adminin (Mund ta ndryshosh sipas dëshirës)
const ADMIN_SECRET_CODE = "1234";

const MONGO_URI = process.env.MONGO_URI || "mongodb+srv://<db_username>:<db_password>@flo.rcc9bqz.mongodb.net/?appName=flo";

mongoose.connect(MONGO_URI)
  .then(() => console.log('✅ Sukses: U lidh me databazën MongoDB!'))
  .catch(err => console.error('❌ Gabim gjatë lidhjes me MongoDB:', err));

// --- MODELI I PRODUKTIT ---
const ProductSchema = new mongoose.Schema({
  emri: { type: String, required: true },
  qmimi: { type: Number, required: true },
  foto: { type: String, required: true },
  pershkrimi: { type: String, required: true }
});
const Product = mongoose.model('Product', ProductSchema);

// --- MODELI I POROSISË ---
const OrderSchema = new mongoose.Schema({
  data: { type: String, default: () => new Date().toLocaleDateString('sq-AL') },
  klienti: { type: String, required: true },
  kontakti: { type: String, required: true },
  adresa: { type: String, required: true },
  produktet: { type: String, required: true },
  totali: { type: Number, required: true },
  statusi: { type: String, default: 'Në Pritje' }
});
const Order = mongoose.model('Order', OrderSchema);


// --- RRUGËZIMET (ROUTES) PËR PRODUKTET ---

// 1. Merr të gjitha produktet (Për index.html)
app.get('/api/products', async (req, res) => {
  try {
    const products = await Product.find();
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: 'Gabim gjatë marrjes së produkteve.' });
  }
});

// 2. Shto produkt të ri (Nga admin.html me kontroll kodi)
app.post('/api/products', async (req, res) => {
  const { kodi, emri, qmimi, foto, pershkrimi } = req.body;

  if (kodi !== ADMIN_SECRET_CODE) {
    return res.status(401).json({ message: 'Kodi i sigurisë së adminit është i gabuar!' });
  }

  try {
    const newProduct = new Product({ emri, qmimi, foto, pershkrimi });
    await newProduct.save();
    res.status(201).json({ message: 'Produkti u publikua me sukses!' });
  } catch (error) {
    res.status(400).json({ message: 'Të dhënat e produktit nuk janë valide.' });
  }
});


// --- RRUGËZIMET (ROUTES) PËR POROSITË ---

// 1. Merr të gjitha porositë (Për tabelën e adminit)
app.get('/api/orders', async (req, res) => {
  try {
    const orders = await Order.find().sort({ _id: -1 }); // Porositë e fundit të para
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: 'Gabim gjatë marrjes së porosive.' });
  }
});

// 2. Krijo porosi të re (Kur klienti blen te dyqani)
app.post('/api/orders', async (req, res) => {
  const { klienti, kontakti, adresa, produktet, totali } = req.body;
  try {
    const newOrder = new Order({ klienti, kontakti, adresa, produktet, totali });
    await newOrder.save();
    res.status(201).json({ message: 'Porosia u krye me sukses!' });
  } catch (error) {
    res.status(400).json({ message: 'Dështoi dërgimi i porosisë.' });
  }
});

// 3. Ndrysho statusin e porosisë në "Përfunduar"
app.patch('/api/orders/:id', async (req, res) => {
  try {
    const updatedOrder = await Order.findByIdAndUpdate(
      req.params.id, 
      { statusi: 'Përfunduar' }, 
      { new: true }
    );
    res.json(updatedOrder);
  } catch (error) {
    res.status(400).json({ message: 'Nuk u mundësua përditësimi i porosisë.' });
  }
});


// Ndezja e Serverit
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Serveri po punon në: http://localhost:${PORT}`);
});

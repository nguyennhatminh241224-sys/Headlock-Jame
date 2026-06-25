require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();
const PORT = process.env.PORT || 10000;
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || 'change-this-admin-token';

app.use(cors({ origin: true }));
app.use(express.json({ limit: '1mb' }));
app.use(express.static(path.join(__dirname, 'public')));

const keySchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true, index: true },
  days: { type: Number, default: 1 },
  maxSlots: { type: Number, default: 1 },
  devices: [{
    deviceId: String,
    firstUsedAt: Date,
    lastUsedAt: Date
  }],
  active: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, default: null },
  note: { type: String, default: '' }
});

const LicenseKey = mongoose.model('LicenseKey', keySchema);

function requireAdmin(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '') || req.headers['x-admin-token'];
  if (!token || token !== ADMIN_TOKEN) {
    return res.status(401).json({ success: false, message: 'Sai ADMIN_TOKEN.' });
  }
  next();
}

function makeKey(prefix = 'JAME') {
  const a = Math.random().toString(36).slice(2, 8).toUpperCase();
  const b = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `${prefix}-${a}-${b}`;
}

app.get('/health', (req, res) => {
  res.json({ success: true, message: 'API online is running.' });
});

app.post('/check-key', async (req, res) => {
  try {
    const key = String(req.body.key || '').trim();
    const deviceId = String(req.body.deviceId || '').trim();

    if (!key || !deviceId) {
      return res.status(400).json({ success: false, message: 'Thiếu key hoặc deviceId.' });
    }

    const license = await LicenseKey.findOne({ key });
    if (!license) {
      return res.status(404).json({ success: false, message: 'Key không tồn tại.' });
    }

    if (!license.active) {
      return res.status(403).json({ success: false, message: 'Key đã bị khóa.' });
    }

    const now = new Date();

    if (!license.expiresAt) {
      license.expiresAt = new Date(now.getTime() + license.days * 24 * 60 * 60 * 1000);
    }

    if (license.expiresAt.getTime() < now.getTime()) {
      license.active = false;
      await license.save();
      return res.status(403).json({ success: false, message: 'Key đã hết hạn.', expiresAt: license.expiresAt });
    }

    const foundDevice = license.devices.find(d => d.deviceId === deviceId);
    if (foundDevice) {
      foundDevice.lastUsedAt = now;
    } else {
      if (license.devices.length >= license.maxSlots) {
        return res.status(403).json({
          success: false,
          message: 'Key đã đủ slot thiết bị.',
          usedSlots: license.devices.length,
          maxSlots: license.maxSlots
        });
      }
      license.devices.push({ deviceId, firstUsedAt: now, lastUsedAt: now });
    }

    await license.save();

    return res.json({
      success: true,
      message: 'Đăng nhập thành công.',
      expiresAt: license.expiresAt,
      usedSlots: license.devices.length,
      maxSlots: license.maxSlots
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Lỗi server.' });
  }
});

app.post('/admin/create-key', requireAdmin, async (req, res) => {
  try {
    const key = String(req.body.key || makeKey(req.body.prefix || 'JAME')).trim().toUpperCase();
    const days = Number(req.body.days || 1);
    const maxSlots = Number(req.body.maxSlots || req.body.slot || 1);
    const note = String(req.body.note || '');

    const created = await LicenseKey.create({ key, days, maxSlots, note });
    res.json({ success: true, key: created.key, days: created.days, maxSlots: created.maxSlots });
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ success: false, message: 'Key đã tồn tại.' });
    console.error(err);
    res.status(500).json({ success: false, message: 'Không tạo được key.' });
  }
});

app.get('/admin/keys', requireAdmin, async (req, res) => {
  const keys = await LicenseKey.find().sort({ createdAt: -1 }).limit(300).lean();
  res.json({
    success: true,
    keys: keys.map(k => ({
      key: k.key,
      days: k.days,
      maxSlots: k.maxSlots,
      usedSlots: k.devices?.length || 0,
      active: k.active,
      expiresAt: k.expiresAt,
      createdAt: k.createdAt,
      note: k.note
    }))
  });
});

app.post('/admin/delete-key', requireAdmin, async (req, res) => {
  const key = String(req.body.key || '').trim().toUpperCase();
  if (!key) return res.status(400).json({ success: false, message: 'Thiếu key.' });
  const result = await LicenseKey.deleteOne({ key });
  res.json({ success: true, deletedCount: result.deletedCount });
});

app.post('/admin/disable-key', requireAdmin, async (req, res) => {
  const key = String(req.body.key || '').trim().toUpperCase();
  const license = await LicenseKey.findOneAndUpdate({ key }, { active: false }, { new: true });
  if (!license) return res.status(404).json({ success: false, message: 'Không tìm thấy key.' });
  res.json({ success: true, key: license.key, active: license.active });
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('MongoDB connected');
    app.listen(PORT, () => console.log(`Server running on ${PORT}`));
  })
  .catch(err => {
    console.error('MongoDB connection error:', err.message);
    process.exit(1);
  });

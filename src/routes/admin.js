const express = require('express');
const router = express.Router();
const db = require('../services/supabase');

function authMiddleware(req, res, next) {
  const key = req.headers['x-admin-key'];
  if (!key || key !== process.env.ADMIN_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}

router.use(authMiddleware);

router.get('/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime(), timestamp: new Date().toISOString() });
});

router.get('/stats', async (req, res) => {
  try {
    const [stats, hourly] = await Promise.all([db.getDayStats(), db.getHourlyLeads()]);
    res.json({ ...stats, hourly });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/leads', async (req, res) => {
  try {
    const page  = parseInt(req.query.page)  || 1;
    const limit = parseInt(req.query.limit) || 20;
    const { data, count } = await db.getLeads({ page, limit });
    res.json({ data, count, page, limit });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/leads/:id', async (req, res) => {
  try {
    const lead = await db.getLeadById(req.params.id);
    res.json(lead);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/clients', async (req, res) => {
  try {
    const clients = await db.getClients();
    res.json(clients);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/clients/:id', async (req, res) => {
  try {
    const allowed = { active: req.body.active };
    await db.updateClient(req.params.id, allowed);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/errors', async (req, res) => {
  try {
    const errors = await db.getErrors();
    res.json(errors);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

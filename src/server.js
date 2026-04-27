require('dotenv').config();
const express = require('express');
const path = require('path');
const logger = require('./utils/logger');
const errorHandler = require('./middleware/errorHandler');
const webhookRoutes = require('./routes/webhook');
const adminRoutes  = require('./routes/admin');
const cronRoutes   = require('./routes/cron');

const app = express();
const PORT = process.env.PORT || 3000;

// Twilio sends form-encoded bodies
app.use('/webhook', express.urlencoded({ extended: false }));
app.use(express.json());

// Static dashboard
app.use('/dashboard', express.static(path.join(__dirname, '..', 'public', 'dashboard')));

// Routes
app.use('/webhook', webhookRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/cron',  cronRoutes);

app.get('/', (req, res) => res.redirect('/dashboard'));

app.use(errorHandler);

app.listen(PORT, () => {
  logger.info('server', `LeadPilot API running on port ${PORT}`);
});

process.on('unhandledRejection', (reason) => {
  logger.error('process', 'unhandledRejection', String(reason));
});

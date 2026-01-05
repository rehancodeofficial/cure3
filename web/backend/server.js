const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const app = express();

/* ----------------------------
   ✅ GLOBAL MIDDLEWARES
----------------------------- */
app.use(
  cors({
    origin: [
      'http://localhost:5173',
      'http://localhost:5174',
      'http://localhost:5175',
      'http://localhost:5176',
      'https://curevirtual.vercel.app',
      'https://cure-virtual-2.vercel.app',
      process.env.CORS_ORIGIN,
    ].filter(Boolean),
    credentials: true,
  })
);

app.use(cookieParser());

// Support raw body for Stripe webhook specifically
app.use((req, res, next) => {
  if (req.originalUrl === '/api/subscription/stripe/webhook') {
    next();
  } else {
    express.json({ limit: '10kb' })(req, res, next);
  }
});

/* ----------------------------
   ✅ HEALTH CHECK
----------------------------- */
app.get('/api/health', (_req, res) => res.json({ ok: true }));

/* ----------------------------
   ✅ ROUTES
----------------------------- */

// AUTH / TWILIO
app.use('/api/auth', require('./routes/auth'));
app.use('/api/token', require('./routes/twilioToken'));
app.use('/api/otp', require('./routes/otp'));

// SUPERADMIN
app.use('/api/superadmin', require('./routes/superadmin'));
app.use('/api/superadmin/settings', require('./routes/settings'));
app.use('/api/settings', require('./routes/settings'));
app.use('/api/superadmin/reports', require('./routes/reports'));
app.use('/api/superadmin/logs', require('./routes/logs'));
app.use('/api/superadmin/activity-logs', require('./routes/activityLogs'));

// ADMIN
app.use('/api/admins', require('./routes/admins'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/admin/users', require('./routes/adminUsers'));
app.use('/api/admin/messages', require('./routes/messages'));
app.use('/api/admin', require('./routes/adminSubscription'));

// DOCTOR
app.use('/api', require('./routes/doctorPatients'));
app.use('/api/doctor', require('./routes/doctor'));
app.use('/api/doctor/video', require('./routes/doctorVideo'));
app.use('/api/videocall', require('./routes/videocall'));

// SCHEDULE
app.use('/api/schedule', require('./routes/scheduleRoutes'));

// PATIENT
app.use('/api', require('./routes/patientDoctors'));
app.use('/api/patient', require('./routes/patientRoutes'));

// OTHER
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/chatbot', require('./routes/chatbot.routes'));
app.use('/api/internal', require('./routes/internal'));
app.use('/api/support', require('./routes/support'));
app.use('/api/pharmacy', require('./routes/pharmacy'));
app.use('/api/users', require('./routes/user'));

// SUBSCRIPTIONS
const subscriptionRoutes = require('./routes/subscription');
app.use('/api', subscriptionRoutes);
app.use('/api/subscribers', subscriptionRoutes);

// Stripe Webhook (RAW BODY)
app.post(
  '/api/subscription/stripe/webhook',
  express.raw({ type: 'application/json' }),
  subscriptionRoutes.stripeWebhook
);

// TEST ROUTES
app.get('/api/test', (_req, res) =>
  res.json({ message: 'API is working!' })
);

app.get('/api/doctor/test', (_req, res) =>
  res.json({ message: 'Doctor routes are working!' })
);

/* ----------------------------
   ✅ SERVE FRONTEND (Vercel)
----------------------------- */
// In Vercel, we don't strictly need to serve static files from server.js if vercel.json handles it,
// but keeping it as a fallback is fine.
const distPath = path.join(__dirname, 'dist');
app.use(express.static(distPath));

app.get('*', (req, res) => {
  if (!req.url.startsWith('/api/')) {
    res.sendFile(path.join(distPath, 'index.html'));
  } else {
    res.status(404).json({ error: 'API route not found' });
  }
});

/* ----------------------------
   ❌ REMOVE app.listen()
   ✅ EXPORT APP FOR VERCEL
----------------------------- */
module.exports = app;

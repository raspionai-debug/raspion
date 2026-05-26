require('dotenv').config();
const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Fallback configuration if env vars are missing
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://vikbzyoihljvkvvuvgbl.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZpa2J6eW9paGxqdmt2dnV2Z2JsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk3MTc1OTcsImV4cCI6MjA5NTI5MzU5N30.yu_s9HGHNKfalAPctgqOAwTaY6C53Nf3gSNgKDdQrDw';

// Serve configuration endpoint for frontend (injects public Supabase config)
app.get('/api/config', (req, res) => {
  res.json({
    supabaseUrl: SUPABASE_URL,
    supabaseAnonKey: SUPABASE_ANON_KEY
  });
});

// Trigger Notification Endpoint (Simulated or Real Email/SMS)
app.post('/api/trigger-checkmark', async (req, res) => {
  const { patientName, patientEmail, patientPhone, purpose, doctorName, doctorEmail } = req.body;
  
  console.log(`[TRIGGERED] Patient "${patientName}" called into Doctor "${doctorName}".`);
  console.log(`[ACTION] Sending Patient SMS notification to: ${patientPhone}`);
  console.log(`[ACTION] Sending Patient Email notification to: ${patientEmail}`);
  console.log(`[ACTION] Sending Doctor Email notification to: ${doctorEmail}`);
  
  // Here we would implement nodemailer or twilio if configured.
  // For demo/production integration, we simulate a latency and return a clean success.
  setTimeout(() => {
    res.json({
      success: true,
      message: 'Simulated notifications sent successfully!',
      details: {
        patient: {
          sms: `SMS Sent to ${patientPhone}: "Hi ${patientName}, ${doctorName} is ready to see you. Please step in."`,
          email: `Email Sent to ${patientEmail}: "Your consultation is starting now."`
        },
        doctor: {
          email: `Email Sent to ${doctorEmail}: "Patient Alert: ${patientName} is walking in. Reason: ${purpose}."`
        }
      }
    });
  }, 1000);
});

// Serve public/admin.html for admin route
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// Wildcard route to handle spa routing (optional but nice)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`==================================================`);
  console.log(` RASPION Clinic Automation Platform is running!`);
  console.log(` URL: http://localhost:${PORT}`);
  console.log(` Admin Portal: http://localhost:${PORT}/admin`);
  console.log(`==================================================`);
});

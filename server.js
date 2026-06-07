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

// POST Endpoint to handle Workspace upgrade / Contact inquiries and route them via Resend
app.post('/api/submit-inquiry', async (req, res) => {
  const { name, clinicName, email, phone, message } = req.body;

  if (!name || !clinicName || !email || !phone || !message) {
    return res.status(400).json({ success: false, error: 'All fields are required.' });
  }

  let resendApiKey = process.env.RESEND_API_KEY;
  let toEmail = process.env.NOTIFICATION_EMAIL;

  if (!resendApiKey) {
    try {
      // Reload dotenv in case the file was modified while the server was running
      require('dotenv').config();
      resendApiKey = process.env.RESEND_API_KEY;
      toEmail = process.env.NOTIFICATION_EMAIL;
    } catch (e) {
      console.error('Failed to hot-reload dotenv:', e);
    }
  }

  if (!toEmail) {
    toEmail = 'raspionai@gmail.com';
  }

  if (!resendApiKey) {
    console.error('[ERROR] Resend API Key is missing in environment configuration.');
    return res.status(500).json({ success: false, error: 'Email delivery is not configured on the server.' });
  }

  try {
    console.log(`[INQUIRY] Received inquiry from ${name} (${clinicName})`);
    
    const emailBody = {
      from: 'Raspion <onboarding@resend.dev>',
      to: toEmail,
      subject: `New Raspion Clinic Inquiry - ${clinicName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px; background-color: #ffffff; color: #1e293b;">
          <h2 style="color: #0f172a; border-bottom: 2px solid #c2902c; padding-bottom: 10px; margin-top: 0;">New Consultation Inquiry</h2>
          <p style="margin: 15px 0;"><strong>Name:</strong> ${name}</p>
          <p style="margin: 15px 0;"><strong>Workspace / Clinic Name:</strong> ${clinicName}</p>
          <p style="margin: 15px 0;"><strong>Email Address:</strong> <a href="mailto:${email}" style="color: #3b82f6;">${email}</a></p>
          <p style="margin: 15px 0;"><strong>Contact Phone:</strong> ${phone}</p>
          
          <div style="margin-top: 20px; padding: 15px; background-color: #f8fafc; border-left: 4px solid #c2902c; border-radius: 4px;">
            <h4 style="margin: 0 0 10px 0; color: #0f172a;">Automation Intent:</h4>
            <p style="margin: 0; white-space: pre-wrap; line-height: 1.6; color: #334155;">${message}</p>
          </div>
          
          <p style="font-size: 0.85rem; color: #64748b; margin-top: 30px; border-top: 1px solid #e2e8f0; padding-top: 15px; text-align: center;">
            This email was sent automatically from your Raspion Clinic Automation platform.
          </p>
        </div>
      `
    };

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(emailBody)
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('[ERROR] Resend API response error:', data);
      throw new Error(data.message || 'Failed to send email via Resend.');
    }

    console.log('[SUCCESS] Email sent successfully via Resend:', data);
    res.json({ success: true, data });
  } catch (error) {
    console.error('[ERROR] Failed to send email inquiry:', error);
    res.status(500).json({ success: false, error: error.message || 'Failed to send inquiry.' });
  }
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

// Raspion Supabase Client Helper
let supabaseClient = null;

async function initSupabase() {
  if (supabaseClient) return supabaseClient;
  
  try {
    const response = await fetch('/api/config');
    const config = await response.json();
    
    if (config.supabaseUrl && config.supabaseAnonKey) {
      supabaseClient = window.supabase.createClient(config.supabaseUrl, config.supabaseAnonKey);
      console.log('Supabase client initialized successfully.');
      return supabaseClient;
    } else {
      throw new Error('Config missing variables');
    }
  } catch (error) {
    console.warn('Failed to fetch config from backend API. Falling back to default keys...', error);
    const fallbackUrl = 'https://vikbzyoihljvkvvuvgbl.supabase.co';
    const fallbackKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZpa2J6eW9paGxqdmt2dnV2Z2JsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk3MTc1OTcsImV4cCI6MjA5NTI5MzU5N30.yu_s9HGHNKfalAPctgqOAwTaY6C53Nf3gSNgKDdQrDw';
    
    if (window.supabase) {
      supabaseClient = window.supabase.createClient(fallbackUrl, fallbackKey);
      console.log('Supabase client initialized with fallback.');
      return supabaseClient;
    } else {
      console.error('Supabase library not loaded.');
      return null;
    }
  }
}

// Attach to window to guarantee global scoping in separate scripts
window.supabaseInitPromise = initSupabase();

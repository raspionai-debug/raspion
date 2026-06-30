// Raspion Operations Admin Portal Controller

// Define a unified data synchronization layer for local & Supabase operations
const db = {
  supabaseClient: null,

  isOnline: () => !!db.supabaseClient,

  setClient: (client) => {
    db.supabaseClient = client;
  },

  // Get patients
  getPatients: async () => {
    if (db.isOnline()) {
      try {
        const { data, error } = await db.supabaseClient
          .from('patients')
          .select('*')
          .order('created_at', { ascending: true });
        if (!error && data) {
          // Sync database patients into local cache
          localStorage.setItem('raspion_local_patients', JSON.stringify(data));
          return data;
        }
        console.warn('Supabase fetch patients error, using local:', error);
      } catch (err) {
        console.warn('Supabase patients query exception, using local:', err);
      }
    }
    return db.getLocalPatients();
  },

  // Insert patient
  insertPatient: async (patient) => {
    let success = false;
    if (db.isOnline()) {
      try {
        const { error } = await db.supabaseClient.from('patients').insert([patient]);
        if (!error) success = true;
        else console.warn('Supabase insert patient error:', error);
      } catch (err) {
        console.warn('Supabase insert patient exception:', err);
      }
    }
    db.saveLocalPatient(patient);
    return success;
  },

  // Update patient status
  checkInPatient: async (id, status, checkedInAt) => {
    let success = false;
    if (db.isOnline()) {
      try {
        const { error } = await db.supabaseClient
          .from('patients')
          .update({ status, checked_in_at: checkedInAt })
          .eq('id', id);
        if (!error) success = true;
        else console.warn('Supabase update status error:', error);
      } catch (err) {
        console.warn('Supabase update status exception:', err);
      }
    }
    db.updateLocalPatient(id, { status, checked_in_at: checkedInAt });
    return success;
  },

  // Delete patient
  deletePatient: async (id) => {
    let success = false;
    if (db.isOnline()) {
      try {
        const { error } = await db.supabaseClient.from('patients').delete().eq('id', id);
        if (!error) success = true;
        else console.warn('Supabase delete error:', error);
      } catch (err) {
        console.warn('Supabase delete exception:', err);
      }
    }
    db.deleteLocalPatient(id);
    return success;
  },

  // Get media items
  getMedia: async () => {
    let cloudItems = [];
    if (db.isOnline()) {
      try {
        const { data, error } = await db.supabaseClient
          .from('media')
          .select('*')
          .order('created_at', { ascending: false });
        if (!error && data) {
          cloudItems = data;
        }
      } catch (err) {
        console.warn('Supabase media select exception:', err);
      }
    }
    
    // Merge cloud items and local items uniquely
    const localItems = db.getLocalMedia();
    const mergedMap = new Map();
    
    // Local items first (often contains very recent local file uploads)
    localItems.forEach(item => mergedMap.set(item.id, item));
    // Cloud items override / add
    cloudItems.forEach(item => mergedMap.set(item.id, item));
    
    // Session memory uploads
    if (window.temp_media_items) {
      window.temp_media_items.forEach(item => mergedMap.set(item.id, item));
    }
    
    // Sort by created_at descending
    const result = Array.from(mergedMap.values())
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      
    return result;
  },

  // Insert media
  insertMedia: async (mediaItem) => {
    let success = false;
    if (db.isOnline()) {
      try {
        const { error } = await db.supabaseClient.from('media').insert([mediaItem]);
        if (!error) success = true;
        else console.warn('Supabase media insert error:', error);
      } catch (err) {
        console.warn('Supabase media insert exception:', err);
      }
    }
    db.saveLocalMedia(mediaItem);
    return success;
  },

  // Delete media
  deleteMedia: async (id, url) => {
    let success = false;
    if (db.isOnline()) {
      try {
        const { error } = await db.supabaseClient.from('media').delete().eq('id', id);
        if (!error) {
          success = true;
          // Try removing from storage
          if (url.includes('media-gallery')) {
            const pathParts = url.split('/media-gallery/');
            if (pathParts.length > 1) {
              await db.supabaseClient.storage.from('media-gallery').remove([pathParts[1]]);
            }
          }
        }
      } catch (err) {
        console.warn('Supabase media delete exception:', err);
      }
    }
    db.deleteLocalMedia(id);
    return success;
  },

  // Local storage cache managers with memory backup
  getLocalPatients: () => {
    try {
      const list = localStorage.getItem('raspion_local_patients');
      if (!list) {
        const defaultPatients = [
          {
            id: 'mock-1',
            name: 'Omkar Sharma',
            phone: '+1 (555) 438-9281',
            email: 'omkar@email.com',
            purpose: 'Follow-up: Pain in left shoulder',
            status: 'Waiting',
            source: 'Voice Autopilot',
            priority: true,
            created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString()
          },
          {
            id: 'mock-2',
            name: 'Sarah Connor',
            phone: '+1 (555) 762-9844',
            email: 'sarah@email.com',
            purpose: 'Consultation: Persistent migraines',
            status: 'Waiting',
            source: 'Walk-in',
            priority: false,
            created_at: new Date(Date.now() - 1000 * 60 * 20).toISOString()
          }
        ];
        try {
          localStorage.setItem('raspion_local_patients', JSON.stringify(defaultPatients));
        } catch (e) {}
        return defaultPatients;
      }
      return JSON.parse(list);
    } catch (e) {
      if (!window.in_memory_patients) {
        window.in_memory_patients = [
          {
            id: 'mock-1',
            name: 'Omkar Sharma',
            phone: '+1 (555) 438-9281',
            email: 'omkar@email.com',
            purpose: 'Follow-up: Pain in left shoulder',
            status: 'Waiting',
            source: 'Voice Autopilot',
            priority: true,
            created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString()
          },
          {
            id: 'mock-2',
            name: 'Sarah Connor',
            phone: '+1 (555) 762-9844',
            email: 'sarah@email.com',
            purpose: 'Consultation: Persistent migraines',
            status: 'Waiting',
            source: 'Walk-in',
            priority: false,
            created_at: new Date(Date.now() - 1000 * 60 * 20).toISOString()
          }
        ];
      }
      return window.in_memory_patients;
    }
  },

  saveLocalPatient: (patient) => {
    try {
      const patients = db.getLocalPatients();
      if (!patients.some(p => p.id === patient.id)) {
        patients.push(patient);
        try {
          localStorage.setItem('raspion_local_patients', JSON.stringify(patients));
        } catch (e) {
          window.in_memory_patients = patients;
        }
      }
    } catch (e) {
      if (!window.in_memory_patients) window.in_memory_patients = [];
      if (!window.in_memory_patients.some(p => p.id === patient.id)) {
        window.in_memory_patients.push(patient);
      }
    }
  },

  updateLocalPatient: (id, updates) => {
    try {
      const patients = db.getLocalPatients();
      const idx = patients.findIndex(p => p.id === id);
      if (idx !== -1) {
        patients[idx] = { ...patients[idx], ...updates };
        try {
          localStorage.setItem('raspion_local_patients', JSON.stringify(patients));
        } catch (e) {
          window.in_memory_patients = patients;
        }
      }
    } catch (e) {
      if (window.in_memory_patients) {
        const idx = window.in_memory_patients.findIndex(p => p.id === id);
        if (idx !== -1) {
          window.in_memory_patients[idx] = { ...window.in_memory_patients[idx], ...updates };
        }
      }
    }
  },

  deleteLocalPatient: (id) => {
    try {
      const patients = db.getLocalPatients();
      const filtered = patients.filter(p => p.id !== id);
      try {
        localStorage.setItem('raspion_local_patients', JSON.stringify(filtered));
      } catch (e) {
        window.in_memory_patients = filtered;
      }
    } catch (e) {
      if (window.in_memory_patients) {
        window.in_memory_patients = window.in_memory_patients.filter(p => p.id !== id);
      }
    }
  },

  getLocalMedia: () => {
    try {
      const list = localStorage.getItem('raspion_local_media');
      if (!list) {
        const defaultMedia = [
          {
            id: 'mock-media-1',
            url: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=600&q=80',
            title: 'Raspion Touch Interface on Frontdesk Tablet',
            type: 'image',
            created_at: new Date(Date.now() - 1000 * 60 * 60).toISOString()
          },
          {
            id: 'mock-media-2',
            url: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=600&q=80',
            title: 'Integrated Voice AI Autopilot Call Logs',
            type: 'image',
            created_at: new Date(Date.now() - 1000 * 60 * 120).toISOString()
          }
        ];
        try {
          localStorage.setItem('raspion_local_media', JSON.stringify(defaultMedia));
        } catch (e) {}
        return defaultMedia;
      }
      return JSON.parse(list);
    } catch (e) {
      if (!window.in_memory_media) {
        window.in_memory_media = [
          {
            id: 'mock-media-1',
            url: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=600&q=80',
            title: 'Raspion Touch Interface on Frontdesk Tablet',
            type: 'image',
            created_at: new Date(Date.now() - 1000 * 60 * 60).toISOString()
          },
          {
            id: 'mock-media-2',
            url: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=600&q=80',
            title: 'Integrated Voice AI Autopilot Call Logs',
            type: 'image',
            created_at: new Date(Date.now() - 1000 * 60 * 120).toISOString()
          }
        ];
      }
      return window.in_memory_media;
    }
  },

  saveLocalMedia: (mediaItem) => {
    try {
      const media = db.getLocalMedia();
      if (!media.some(m => m.id === mediaItem.id)) {
        media.unshift(mediaItem);
        try {
          localStorage.setItem('raspion_local_media', JSON.stringify(media));
        } catch (e) {
          window.in_memory_media = media;
        }
      }
    } catch (e) {
      if (!window.in_memory_media) window.in_memory_media = [];
      if (!window.in_memory_media.some(m => m.id === mediaItem.id)) {
        window.in_memory_media.unshift(mediaItem);
      }
    }
  },

  deleteLocalMedia: (id) => {
    try {
      const media = db.getLocalMedia();
      const filtered = media.filter(m => m.id !== id);
      try {
        localStorage.setItem('raspion_local_media', JSON.stringify(filtered));
      } catch (e) {
        window.in_memory_media = filtered;
      }
    } catch (e) {
      if (window.in_memory_media) {
        window.in_memory_media = window.in_memory_media.filter(m => m.id !== id);
      }
    }
  }
};

document.addEventListener('DOMContentLoaded', async () => {
  // Elements
  const authPanel = document.getElementById('auth-panel');
  const dashboardPanel = document.getElementById('dashboard-panel');
  const logoutBtn = document.getElementById('logout-btn');
  const loginForm = document.getElementById('login-form');
  const authError = document.getElementById('auth-error');

  // Attempt to load Supabase client (does not block application logic if unavailable)
  try {
    const supabase = await window.supabaseInitPromise;
    if (supabase) {
      db.setClient(supabase);
      console.log('Admin Dashboard: Connected to Supabase Cloud Database.');
    } else {
      console.warn('Admin Dashboard: Supabase unavailable. Running in robust local-sync mode.');
    }
  } catch (err) {
    console.warn('Admin Dashboard: Supabase init error. Running in robust local-sync mode.', err);
  }
  
  // 1. Session check
  let isLocalSession = false;
  try {
    isLocalSession = localStorage.getItem('raspion_admin_session') === 'active';
  } catch (e) {
    console.warn('localStorage reading blocked.', e);
  }
  if (isLocalSession) {
    showDashboard();
  }
  
  // 2. Handle login
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      authError.classList.add('hidden');
      
      const email = document.getElementById('login-email').value.trim();
      const password = document.getElementById('login-password').value;
      
      // Local credential check
      if (email === 'raspionadmin@gmail.com' && password === 'anshabhiom') {
        try {
          localStorage.setItem('raspion_admin_session', 'active');
        } catch (e) {}
        showDashboard();
        return;
      }
      
      // Database authentication fallback (if online)
      if (db.isOnline()) {
        try {
          const { data, error } = await db.supabaseClient.auth.signInWithPassword({ email, password });
          if (error) {
            authError.textContent = 'Invalid credentials. Please use the specified email and password.';
            authError.classList.remove('hidden');
          } else if (data.session) {
            try {
              localStorage.setItem('raspion_admin_session', 'active');
            } catch (e) {}
            showDashboard();
          }
          return;
        } catch (err) {
          console.warn('Authentication API error, falling back to offline validation...', err);
        }
      }
      
      authError.textContent = 'Invalid credentials. Please use the specified email and password.';
      authError.classList.remove('hidden');
    });
  }
  
  // 3. Handle logout
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      try {
        localStorage.removeItem('raspion_admin_session');
      } catch (e) {}
      hideDashboard();
    });
  }
  
  function showDashboard() {
    authPanel.classList.add('hidden');
    dashboardPanel.classList.remove('hidden');
    logoutBtn.classList.remove('hidden');
    
    // Inject status indicators in header
    addStatusIndicator();
    
    // Run dashboard initializations
    initQueueBoard();
    initMediaUploader();
  }
  
  function hideDashboard() {
    dashboardPanel.classList.add('hidden');
    logoutBtn.classList.add('hidden');
    authPanel.classList.remove('hidden');
    
    const indicator = document.getElementById('db-status-badge');
    if (indicator) indicator.remove();
  }

  function addStatusIndicator() {
    const existing = document.getElementById('db-status-badge');
    if (existing) return;

    const nav = document.querySelector('header nav');
    if (!nav) return;

    const badge = document.createElement('span');
    badge.id = 'db-status-badge';
    badge.style.fontSize = '0.75rem';
    badge.style.fontFamily = 'var(--font-mono)';
    badge.style.padding = '0.2rem 0.6rem';
    badge.style.borderRadius = '20px';
    badge.style.marginRight = '1rem';
    badge.style.fontWeight = 'bold';

    if (db.isOnline()) {
      badge.style.background = 'rgba(21, 128, 61, 0.1)';
      badge.style.color = 'var(--color-neon-green)';
      badge.style.border = '1px solid rgba(21, 128, 61, 0.2)';
      badge.textContent = 'CLOUD SYNC ACTIVE';
    } else {
      badge.style.background = 'rgba(194, 144, 44, 0.1)';
      badge.style.color = 'var(--color-gold)';
      badge.style.border = '1px solid rgba(194, 144, 44, 0.2)';
      badge.textContent = 'LOCAL STANDALONE';
    }

    nav.insertBefore(badge, logoutBtn);
  }
});

// ==========================================
// Patient Queue Control
// ==========================================
function initQueueBoard() {
  const queueTbody = document.getElementById('admin-queue-tbody');
  const inlineForm = document.getElementById('inline-patient-form');
  const dummyBtn = document.getElementById('add-patient-dummy-btn');
  
  if (!queueTbody) return;
  
  // Refresh function
  async function refreshQueue() {
    const patients = await db.getPatients();
    queueTbody.innerHTML = '';
    
    if (patients.length === 0) {
      queueTbody.innerHTML = `
        <tr>
          <td colspan="5" style="text-align: center; color: var(--text-muted); font-style: italic;">
            No patients in queue. Add one to start.
          </td>
        </tr>
      `;
      return;
    }
    
    patients.forEach(pat => {
      const isWaiting = pat.status === 'Waiting';
      const isCompleted = pat.status === 'Completed' || pat.status === 'In-Progress';
      
      const row = document.createElement('tr');
      row.className = pat.priority ? 'priority-row' : '';
      
      row.innerHTML = `
        <td>
          <strong>${pat.name}</strong><br>
          <span style="font-size:0.75rem; color:var(--text-muted); font-family:var(--font-mono);">${pat.phone}</span>
        </td>
        <td>
          <span class="s-badge ${pat.source.includes('Voice') ? 'green' : (pat.source.includes('WhatsApp') ? 'purple' : 'blue')}">
            ${pat.source}
          </span>
        </td>
        <td>${pat.purpose}</td>
        <td>
          <span class="s-badge ${isWaiting ? 'blue' : 'green'}" style="opacity: ${!isWaiting ? '0.7' : '1'}">
            ${pat.status}
          </span>
        </td>
        <td>
          <div class="action-cell">
            ${isWaiting ? `
              <button class="btn-action success-action" onclick="checkInPatient('${pat.id}', '${pat.name.replace(/'/g, "\\'")}', '${pat.phone}', '${(pat.email || 'patient@email.com').replace(/'/g, "\\'")}', '${pat.purpose.replace(/'/g, "\\'")}')">
                Tick Checkmark
              </button>
            ` : `
              <span style="font-size:0.75rem; color:var(--color-neon-green); font-family:var(--font-mono); margin-right: 0.5rem;">Checked In</span>
            `}
            <button class="btn-action danger-action" onclick="deletePatient('${pat.id}')">
              Remove
            </button>
          </div>
        </td>
      `;
      queueTbody.appendChild(row);
    });
  }
  
  // Submit inline patient form
  inlineForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('inline-name').value;
    const phone = document.getElementById('inline-phone').value;
    const purpose = document.getElementById('inline-purpose').value;
    
    const newPat = {
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : 'local-' + Date.now(),
      name,
      phone,
      purpose,
      status: 'Waiting',
      source: 'Walk-in',
      created_at: new Date().toISOString()
    };
    
    await db.insertPatient(newPat);
    inlineForm.reset();
    refreshQueue();
  });
  
  // Submit dummy patient shortcut
  dummyBtn.addEventListener('click', async () => {
    const names = ['Omkar Sharma', 'Sarah Connor', 'John Miller', 'Alice Vance', 'David Tennant'];
    const purposes = ['Follow-up: Pain in left shoulder', 'Consultation: Persistent migraines', 'Therapy session checkup', 'Inquiry on new treatment'];
    const sources = ['Walk-in', 'Voice Autopilot', 'SMS/WhatsApp'];
    
    const randomName = names[Math.floor(Math.random() * names.length)];
    const randomPurpose = purposes[Math.floor(Math.random() * purposes.length)];
    const randomSource = sources[Math.floor(Math.random() * sources.length)];
    
    const newPat = {
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : 'local-' + Date.now(),
      name: randomName,
      phone: '+1 (555) 438-9281',
      purpose: randomPurpose,
      status: 'Waiting',
      source: randomSource,
      priority: Math.random() > 0.5,
      created_at: new Date().toISOString()
    };
    
    await db.insertPatient(newPat);
    refreshQueue();
  });
  
  // Global handlers
  window.checkInPatient = async function(id, name, phone, email, purpose) {
    await db.checkInPatient(id, 'In-Progress', new Date().toISOString());
    
    try {
      await fetch('/api/trigger-checkmark', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientName: name,
          patientEmail: email,
          patientPhone: phone,
          purpose: purpose,
          doctorName: 'Dr. Aditya',
          doctorEmail: 'aditya@clinic.com'
        })
      });
    } catch (e) {
      console.warn('Backend trigger unreachable.');
    }
    
    refreshQueue();
  };
  
  window.deletePatient = async function(id) {
    if (confirm('Are you sure you want to remove this patient from the queue?')) {
      await db.deletePatient(id);
      refreshQueue();
    }
  };
  
  refreshQueue();
}

// ==========================================
// Media Portal & Uploader
// ==========================================
// Helper to extract YouTube video ID
function getYouTubeId(url) {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=|shorts\/)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
}

// Helper to generate a valid UUID for Supabase compatibility
function generateUUID() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// ==========================================
function initMediaUploader() {
  const dropZone = document.getElementById('drop-zone');
  const fileInput = document.getElementById('media-file-input');
  const urlInput = document.getElementById('media-url-input');
  const addLinkBtn = document.getElementById('add-link-btn');
  const captionInput = document.getElementById('media-caption');
  const progressContainer = document.getElementById('progress-container');
  const progressFill = document.getElementById('progress-bar-fill');
  const progressLabel = document.getElementById('upload-status-lbl');
  const mediaList = document.getElementById('admin-media-list');
  
  if (!dropZone) return;
  
  async function refreshMedia() {
    const media = await db.getMedia();
    mediaList.innerHTML = '';
    
    if (media.length === 0) {
      mediaList.innerHTML = `
        <div style="grid-column:1/-1; text-align:center; color:var(--text-muted); font-style:italic; padding: 2rem 0;">
          No media uploaded yet.
        </div>
      `;
      return;
    }
    
    media.forEach(item => {
      const container = document.createElement('div');
      container.className = 'admin-media-item';
      
      let previewHTML = '';
      const ytId = getYouTubeId(item.url);
      if (item.type === 'youtube' || ytId) {
        const videoId = ytId || item.url;
        previewHTML = `
          <div class="admin-media-preview-container" style="position:relative; width:100%; height:120px; overflow:hidden; background:#000; border-radius:4px;">
            <iframe src="https://www.youtube.com/embed/${videoId}?controls=1" frameborder="0" style="position:absolute; top:0; left:0; width:100%; height:100%; border:none; pointer-events:none;" allowfullscreen></iframe>
          </div>
        `;
      } else if (item.type === 'video' || item.url.endsWith('.mp4') || item.url.includes('video') || item.url.startsWith('data:video/')) {
        previewHTML = `<video src="${item.url}" class="admin-media-preview" autoplay loop muted playsinline></video>`;
      } else {
        previewHTML = `<img src="${item.url}" class="admin-media-preview" alt="Preview">`;
      }
      
      container.innerHTML = `
        ${previewHTML}
        <div class="admin-media-meta">
          <span style="font-weight:600; text-overflow:ellipsis; overflow:hidden; white-space:nowrap; max-width: 120px;" title="${item.title || 'Untitled'}">
            ${item.title || 'Untitled'}
          </span>
          <button class="btn-action danger-action btn-sm" onclick="deleteMedia('${item.id}', '${item.url}')">
            Delete
          </button>
        </div>
      `;
      mediaList.appendChild(container);
    });
  }
  
  let selectedFile = null;
  
  dropZone.addEventListener('click', () => fileInput.click());
  
  dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.style.borderColor = 'var(--text-white)';
  });
  
  dropZone.addEventListener('dragleave', () => {
    dropZone.style.borderColor = 'var(--glass-border)';
  });
  
  dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.style.borderColor = 'var(--glass-border)';
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      selectedFile = files[0];
      if (urlInput) urlInput.value = ''; // clear url input since file is selected
      const label = dropZone.querySelector('span');
      if (label) {
        label.innerHTML = `Selected file: <strong style="color:var(--color-gold)">${selectedFile.name}</strong> (click to change)`;
      }
    }
  });
  
  fileInput.addEventListener('change', () => {
    if (fileInput.files.length > 0) {
      selectedFile = fileInput.files[0];
      if (urlInput) urlInput.value = ''; // clear url input
      const label = dropZone.querySelector('span');
      if (label) {
        label.innerHTML = `Selected file: <strong style="color:var(--color-gold)">${selectedFile.name}</strong> (click to change)`;
      }
    }
  });

  if (addLinkBtn) {
    addLinkBtn.addEventListener('click', async () => {
      const url = urlInput ? urlInput.value.trim() : '';
      const title = captionInput.value.trim();
      
      if (!selectedFile && !url) {
        alert('Please select a file or enter a YouTube URL / direct link.');
        return;
      }
      
      if (selectedFile) {
        // Upload the selected file with the provided caption
        const uploadTitle = title || selectedFile.name;
        await handleUpload(selectedFile, uploadTitle);
        
        // Reset file selection state
        selectedFile = null;
        const label = dropZone.querySelector('span');
        if (label) {
          label.innerHTML = `Drag and drop image or video here, or <strong style="color:var(--color-gold)">click to browse</strong>`;
        }
        return;
      }
      
      // Handle URL link
      const ytId = getYouTubeId(url);
      const isVideo = url.match(/\.(mp4|webm|ogg|mov)$/i);
      const type = ytId ? 'youtube' : (isVideo ? 'video' : 'image');
      
      progressContainer.classList.remove('hidden');
      progressFill.style.width = '30%';
      progressLabel.textContent = 'Saving media link...';
      
      const mediaItem = {
        id: generateUUID(),
        url: url,
        type: type,
        title: title || 'Link Media',
        created_at: new Date().toISOString()
      };
      
      progressFill.style.width = '70%';
      progressLabel.textContent = 'Registering link...';
      
      try {
        await db.insertMedia(mediaItem);
        progressFill.style.width = '100%';
        progressLabel.textContent = 'Media link added successfully!';
        
        if (urlInput) urlInput.value = '';
        captionInput.value = '';
        
        setTimeout(() => {
          progressContainer.classList.add('hidden');
          refreshMedia();
        }, 1000);
      } catch (err) {
        console.error('Failed to add media link:', err);
        alert('Failed to add media link: ' + err.message);
        progressContainer.classList.add('hidden');
      }
    });
  }
  
  async function handleUpload(file, customTitle) {
    const title = customTitle || captionInput.value.trim() || file.name;
    const type = file.type.startsWith('video') ? 'video' : 'image';
    
    progressContainer.classList.remove('hidden');
    progressFill.style.width = '10%';
    progressLabel.textContent = 'Uploading...';
    
    if (db.isOnline()) {
      try {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `practice_media/${fileName}`;
        
        progressFill.style.width = '40%';
        progressLabel.textContent = 'Uploading to cloud storage...';
        
        const { data: uploadData, error: uploadError } = await db.supabaseClient.storage
          .from('media-gallery')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false
          });
          
        if (uploadError) {
          throw uploadError;
        }
        
        progressFill.style.width = '70%';
        progressLabel.textContent = 'Registering URL...';
        
        const { data: { publicUrl } } = db.supabaseClient.storage
          .from('media-gallery')
          .getPublicUrl(filePath);
          
        const mediaItem = {
          id: generateUUID(),
          url: publicUrl,
          type,
          title,
          created_at: new Date().toISOString()
        };
        
        await db.insertMedia(mediaItem);
        
        progressFill.style.width = '100%';
        progressLabel.textContent = 'Upload complete!';
        
        captionInput.value = '';
        fileInput.value = '';
        if (urlInput) urlInput.value = '';
        
        setTimeout(() => {
          progressContainer.classList.add('hidden');
          refreshMedia();
        }, 1000);
        return;
      } catch (err) {
        console.warn('Supabase cloud upload failed, falling back to local upload...', err);
      }
    }
    
    // Local fallback: read file as base64 and write to local storage
    progressFill.style.width = '40%';
    progressLabel.textContent = 'Reading file locally...';
    
    const reader = new FileReader();
    reader.onload = async (event) => {
      const dataUrl = event.target.result;
      
      progressFill.style.width = '80%';
      progressLabel.textContent = 'Saving locally...';
      
      const mediaItem = {
        id: generateUUID(),
        url: dataUrl,
        type,
        title,
        created_at: new Date().toISOString()
      };
      
      try {
        await db.insertMedia(mediaItem);
        progressFill.style.width = '100%';
        progressLabel.textContent = 'Upload complete (saved locally)!';
      } catch (storageError) {
        console.warn('Local Storage quota exceeded. Storing in session memory...', storageError);
        alert('File upload failed: Local storage limit exceeded. Please upload a smaller image or paste a YouTube URL / direct link instead.');
        
        if (!window.temp_media_items) window.temp_media_items = [];
        window.temp_media_items.unshift(mediaItem);
        progressFill.style.width = '100%';
        progressLabel.textContent = 'Upload complete (saved in session memory)!';
      }
      
      captionInput.value = '';
      fileInput.value = '';
      if (urlInput) urlInput.value = '';
      
      setTimeout(() => {
        progressContainer.classList.add('hidden');
        refreshMedia();
      }, 1000);
    };
    reader.readAsDataURL(file);
  }
  
  window.deleteMedia = async function(id, url) {
    if (confirm('Are you sure you want to delete this media item?')) {
      await db.deleteMedia(id, url);
      if (window.temp_media_items) {
        window.temp_media_items = window.temp_media_items.filter(m => m.id !== id);
      }
      refreshMedia();
    }
  };
  
  refreshMedia();
}

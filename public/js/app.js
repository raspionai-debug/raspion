// Raspion Public Application Logic

document.addEventListener('DOMContentLoaded', async () => {
  // Wait for Supabase to initialize using global window object
  const supabase = await window.supabaseInitPromise;
  
  // Theme Toggle Setup
  initThemeToggle();
  
  // Generative Canvas Setup (High Density & Premium Visuals)
  initGenerativeCanvas();
  
  // Initialize dynamic components
  initIntakeForm(supabase);
  initContactForm();
  initCheckmarkSimulator();
  initVoiceAiSimulator();
  initChatSimulator();
  loadGallery(supabase);
});

// Scroll to simulator helper
function scrollToSim(id) {
  const element = document.getElementById(id);
  if (element) {
    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    element.style.borderColor = 'var(--text-white)';
    setTimeout(() => {
      element.style.borderColor = 'var(--glass-border)';
    }, 1500);
  }
}

// ==========================================
// Theme Toggle Controller
// ==========================================
function initThemeToggle() {
  const toggleBtn = document.getElementById('theme-toggle');
  const moonPath = document.getElementById('moon-path');
  const sunPath = document.getElementById('sun-path');
  
  if (!toggleBtn) return;
  
  try {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      document.body.classList.add('dark-mode');
      if (moonPath) moonPath.classList.add('hidden');
      if (sunPath) sunPath.classList.remove('hidden');
    }
    
    toggleBtn.addEventListener('click', () => {
      document.body.classList.toggle('dark-mode');
      const isDark = document.body.classList.contains('dark-mode');
      try {
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
      } catch (e) {}
      
      if (isDark) {
        if (moonPath) moonPath.classList.add('hidden');
        if (sunPath) sunPath.classList.remove('hidden');
      } else {
        if (sunPath) sunPath.classList.add('hidden');
        if (moonPath) moonPath.classList.remove('hidden');
      }
    });
  } catch (e) {
    console.warn('LocalStorage theme config blocked.', e);
  }
}

// ==========================================
// Generative Cognitive Grid Canvas
// ==========================================
function initGenerativeCanvas() {
  const canvas = document.getElementById('generative-canvas');
  if (!canvas) return;
  
  const ctx = canvas.getContext('2d');
  
  // Resize handler
  let width = canvas.width = canvas.offsetWidth;
  let height = canvas.height = canvas.offsetHeight;
  
  window.addEventListener('resize', () => {
    if (canvas.offsetWidth > 0) {
      width = canvas.width = canvas.offsetWidth;
      height = canvas.height = canvas.offsetHeight;
    }
  });
  
  // High-density particle configurations for rich class aesthetics
  const particles = [];
  const particleCount = 70; // Richer, denser particle field
  const connectionDistance = 95; // Longer, connecting web lines
  
  const mouse = { x: null, y: null, active: false, radius: 120 };
  
  canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;
    mouse.active = true;
  });
  
  canvas.addEventListener('mouseleave', () => {
    mouse.active = false;
  });
  
  let pulses = [];
  canvas.addEventListener('click', (e) => {
    const rect = canvas.getBoundingClientRect();
    pulses.push({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      r: 5,
      maxR: 180,
      opacity: 1
    });
    playTickSound();
  });
  
  // Initialize particles
  for (let i = 0; i < particleCount; i++) {
    particles.push({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.7,
      vy: (Math.random() - 0.5) * 0.7,
      r: Math.random() * 2 + 1.2,
      orbitId: Math.floor(Math.random() * 5), // 5 concentric rings for more depth
      angle: Math.random() * Math.PI * 2,
      orbitSpeed: (Math.random() * 0.003 + 0.0008) * (Math.random() > 0.5 ? 1 : -1)
    });
  }
  
  let rotationAngle = 0;
  
  function animate() {
    ctx.clearRect(0, 0, width, height);
    
    const isDark = document.body.classList.contains('dark-mode');
    
    // Dynamic theme styling colors
    const primaryNavy = isDark ? '#38bdf8' : '#0a1b3a'; 
    const accentGold = isDark ? '#f59e0b' : '#c2902c'; 
    
    const centerX = width / 2;
    const centerY = height / 2;
    
    rotationAngle += 0.0008;
    ctx.lineWidth = 1;
    
    // Concentric orbits (Antique Astrolabe / Clockwork theme) - expanded to 5 rings
    const orbits = [50, 95, 140, 185, 230];
    
    // Draw technical coordinates crosshair
    ctx.strokeStyle = isDark ? 'rgba(56, 189, 248, 0.05)' : 'rgba(10, 27, 58, 0.04)';
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(centerX - 240, centerY);
    ctx.lineTo(centerX + 240, centerY);
    ctx.moveTo(centerX, centerY - 240);
    ctx.lineTo(centerX, centerY + 240);
    ctx.stroke();
    
    orbits.forEach((radius, idx) => {
      ctx.strokeStyle = isDark 
        ? `rgba(56, 189, 248, ${0.09 - idx * 0.015})` 
        : `rgba(10, 27, 58, ${0.07 - idx * 0.012})`;
      
      ctx.beginPath();
      if (idx % 2 === 1) {
        ctx.setLineDash([4, 10]);
        ctx.arc(centerX, centerY, radius, rotationAngle * (idx === 1 ? 1 : -1), rotationAngle * (idx === 1 ? 1 : -1) + Math.PI * 2);
      } else {
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      }
      ctx.stroke();
      ctx.setLineDash([]);
    });

    // Draw technical compass ring and ticks on the outer orbit
    const tickOrbit = orbits[4];
    ctx.strokeStyle = isDark ? 'rgba(56, 189, 248, 0.12)' : 'rgba(10, 27, 58, 0.08)';
    ctx.lineWidth = 0.8;
    for (let angleDeg = 0; angleDeg < 360; angleDeg += 3) {
      const rad = (angleDeg * Math.PI) / 180;
      const isMajor = angleDeg % 15 === 0;
      const tickLen = isMajor ? 8 : 4;
      const x1 = centerX + Math.cos(rad) * tickOrbit;
      const y1 = centerY + Math.sin(rad) * tickOrbit;
      const x2 = centerX + Math.cos(rad) * (tickOrbit + tickLen);
      const y2 = centerY + Math.sin(rad) * (tickOrbit + tickLen);
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }

    // Draw technical coordinate direction indicators
    ctx.fillStyle = isDark ? 'rgba(56, 189, 248, 0.35)' : 'rgba(10, 27, 58, 0.3)';
    ctx.font = '7.5px var(--font-mono)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const directions = [
      { txt: 'N', a: -Math.PI / 2 },
      { txt: 'E', a: 0 },
      { txt: 'S', a: Math.PI / 2 },
      { txt: 'W', a: Math.PI },
      { txt: '045°', a: -Math.PI / 4 },
      { txt: '135°', a: Math.PI / 4 },
      { txt: '225°', a: 3 * Math.PI / 4 },
      { txt: '315°', a: -3 * Math.PI / 4 }
    ];
    directions.forEach(dir => {
      const labelRadius = tickOrbit + 16;
      const lx = centerX + Math.cos(dir.a) * labelRadius;
      const ly = centerY + Math.sin(dir.a) * labelRadius;
      ctx.fillText(dir.txt, lx, ly);
    });

    // Draw Technical HUD Text
    ctx.fillStyle = isDark ? 'rgba(56, 189, 248, 0.45)' : 'rgba(10, 27, 58, 0.4)';
    ctx.font = '8px var(--font-mono)';
    ctx.textAlign = 'left';
    ctx.fillText('COGNITIVE GRID V2.06', centerX - 215, centerY - 215);
    ctx.textAlign = 'right';
    ctx.fillText('AUTOPILOT COORD SCAN', centerX + 215, centerY - 215);
    
    // Update and draw pulses (rich multi-ring wave)
    pulses.forEach((p, idx) => {
      p.r += 3.5;
      p.opacity = 1 - (p.r / p.maxR);
      if (p.opacity <= 0) {
        pulses.splice(idx, 1);
        return;
      }
      
      // Core ring
      ctx.strokeStyle = `rgba(${isDark ? '56,189,248' : '194,144,44'}, ${p.opacity * 0.45})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.stroke();

      // Secondary nested ring
      if (p.r * 0.7 > 5) {
        ctx.strokeStyle = `rgba(${isDark ? '194,144,44' : '10,27,58'}, ${p.opacity * 0.25})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r * 0.7, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Faint outer echo ring
      if (p.r * 1.35 < p.maxR) {
        ctx.strokeStyle = `rgba(${isDark ? '56,189,248' : '56,189,248'}, ${p.opacity * 0.12})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r * 1.35, 0, Math.PI * 2);
        ctx.stroke();
      }
    });
    
    // Draw particles and connection lines
    ctx.lineWidth = 0.65;
    for (let i = 0; i < particles.length; i++) {
      const p1 = particles[i];
      p1.angle += p1.orbitSpeed;
      
      const targetRadius = orbits[p1.orbitId];
      const targetX = centerX + Math.cos(p1.angle) * targetRadius;
      const targetY = centerY + Math.sin(p1.angle) * targetRadius;
      
      p1.vx += (targetX - p1.x) * 0.004;
      p1.vy += (targetY - p1.y) * 0.004;
      
      if (mouse.active) {
        const dx = p1.x - mouse.x;
        const dy = p1.y - mouse.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < mouse.radius) {
          const force = (mouse.radius - dist) / mouse.radius;
          p1.vx += (dx / dist) * force * 0.45;
          p1.vy += (dy / dist) * force * 0.45;
        }
      }
      
      p1.vx *= 0.93;
      p1.vy *= 0.93;
      
      p1.x += p1.vx;
      p1.y += p1.vy;
      
      // Draw glowing particle aura
      ctx.fillStyle = p1.orbitId % 2 === 1 ? 'rgba(194, 144, 44, 0.12)' : 'rgba(29, 78, 216, 0.09)';
      if (isDark && p1.orbitId % 2 !== 1) ctx.fillStyle = 'rgba(56, 189, 248, 0.12)';
      ctx.beginPath();
      ctx.arc(p1.x, p1.y, p1.r * 4.5, 0, Math.PI * 2);
      ctx.fill();

      // Draw particle core
      ctx.fillStyle = p1.orbitId % 2 === 1 ? accentGold : primaryNavy;
      ctx.beginPath();
      ctx.arc(p1.x, p1.y, p1.r, 0, Math.PI * 2);
      ctx.fill();
      
      for (let j = i + 1; j < particles.length; j++) {
        const p2 = particles[j];
        const dx = p1.x - p2.x;
        const dy = p1.y - p2.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist < connectionDistance) {
          const opacity = (connectionDistance - dist) / connectionDistance;
          ctx.strokeStyle = `rgba(${isDark ? '56,189,248' : '10,27,58'}, ${opacity * 0.13})`;
          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.stroke();
        }
      }
    }
    
    // Draw central brand core
    ctx.fillStyle = isDark ? '#ffffff' : '#0a1b3a';
    ctx.shadowColor = isDark ? 'rgba(56,189,248,0.35)' : 'rgba(10,27,58,0.1)';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(centerX, centerY, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0; 
    
    requestAnimationFrame(animate);
  }
  
  animate();
}

// ==========================================
// FEATURE 1: Reception Intake Form & Queue
// ==========================================
function initIntakeForm(supabase) {
  const form = document.getElementById('hero-intake-form');
  const successDiv = document.getElementById('intake-success');
  const resetBtn = document.getElementById('reset-intake');
  
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const name = document.getElementById('intake-name').value;
    const phone = document.getElementById('intake-phone').value;
    const email = document.getElementById('intake-email').value;
    const purpose = document.getElementById('intake-purpose').value;
    
    const patientData = {
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : 'local-' + Date.now(),
      name,
      phone,
      email,
      purpose,
      status: 'Waiting',
      source: 'Walk-in',
      priority: false,
      created_at: new Date().toISOString()
    };

    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('patients')
          .insert([patientData])
          .select();
        if (error) throw error;
        console.log('Saved patient to database:', data);
      } catch (err) {
        console.error('Database save failed, continuing locally...', err);
      }
    }

    // Save to local storage for admin portal sync in the same browser session
    try {
      const localList = localStorage.getItem('raspion_local_patients');
      const list = localList ? JSON.parse(localList) : [];
      list.push(patientData);
      localStorage.setItem('raspion_local_patients', JSON.stringify(list));
    } catch (e) {
      console.warn('LocalStorage save failed:', e);
    }

    addPatientToQueue(patientData);
    
    form.classList.add('hidden');
    successDiv.classList.remove('hidden');
  });

  resetBtn.addEventListener('click', () => {
    form.reset();
    successDiv.classList.add('hidden');
    form.classList.remove('hidden');
  });
}

function initContactForm() {
  const form = document.getElementById('contact-form');
  const successDiv = document.getElementById('contact-success');
  
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const name = document.getElementById('contact-name').value;
    const clinicName = document.getElementById('contact-clinic').value;
    const email = document.getElementById('contact-email').value;
    const phone = document.getElementById('contact-phone').value;
    const message = document.getElementById('contact-message').value;

    const submitBtn = form.querySelector('button[type="submit"]');
    const originalBtnText = submitBtn ? submitBtn.textContent : 'Submit Inquiry';

    // Disable form controls
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Sending...';
    }

    try {
      const response = await fetch('/api/submit-inquiry', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name, clinicName, email, phone, message })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit inquiry.');
      }

      // Success
      if (successDiv) {
        successDiv.classList.remove('hidden');
        successDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
      
      // Reset form fields
      form.reset();
      
      // Keep success message visible for 7 seconds, then hide it
      setTimeout(() => {
        if (successDiv) {
          successDiv.classList.add('hidden');
        }
      }, 7000);

    } catch (err) {
      console.error('[ERROR] Form submission failed:', err);
      alert('Error: ' + err.message);
    } finally {
      // Re-enable submit button
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = originalBtnText;
      }
    }
  });
}

function addPatientToQueue(patient) {
  const queueContainer = document.getElementById('sim-queue');
  if (!queueContainer) return;
  
  const id = patient.id || 'local-' + Date.now();
  if (!patient.id) patient.id = id;
  const timeStr = new Date(patient.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  // Save to local storage for admin portal sync in case it came from simulator triggers (Voice AI/WhatsApp)
  try {
    const localList = localStorage.getItem('raspion_local_patients');
    const list = localList ? JSON.parse(localList) : [];
    if (!list.some(p => p.id === patient.id || (p.name === patient.name && p.created_at === patient.created_at))) {
      list.push(patient);
      localStorage.setItem('raspion_local_patients', JSON.stringify(list));
    }
  } catch (e) {
    console.warn('LocalStorage save in addPatientToQueue failed:', e);
  }
  
  const itemHTML = `
    <div class="queue-item" id="patient-${id}" style="animation: slideIn 0.4s ease forwards;">
      <div class="queue-meta">
        <span class="p-badge blue">Walk-In</span>
        <span class="time-stamp">${timeStr}</span>
      </div>
      <div class="patient-details">
        <div class="pat-name">${patient.name}</div>
        <div class="pat-purpose">${patient.purpose}</div>
      </div>
      <div class="check-trigger">
        <span class="check-label">Call In</span>
        <input type="checkbox" class="checkmark-input" 
          data-id="${id}" 
          data-name="${patient.name}" 
          data-purpose="${patient.purpose}" 
          data-email="${patient.email || 'patient@email.com'}" 
          data-phone="${patient.phone}" 
          data-doctor="Dr. Aditya" 
          data-docemail="aditya@clinic.com">
      </div>
    </div>
  `;
  
  queueContainer.insertAdjacentHTML('beforeend', itemHTML);
  bindCheckmarkEvents();
}

function initCheckmarkSimulator() {
  bindCheckmarkEvents();
}

function bindCheckmarkEvents() {
  const checkboxes = document.querySelectorAll('.checkmark-input');
  
  checkboxes.forEach(box => {
    if (box.dataset.bound === 'true') return;
    box.dataset.bound = 'true';

    box.addEventListener('change', async function() {
      if (this.checked) {
        const patientId = this.dataset.id;
        const name = this.dataset.name;
        const purpose = this.dataset.purpose;
        const email = this.dataset.email;
        const phone = this.dataset.phone;
        const doctor = this.dataset.doctor;
        const docEmail = this.dataset.docemail;
        
        const queueItem = document.getElementById(`patient-${patientId}`);
        if (queueItem) queueItem.classList.add('active');
        
        const nodeDoc = document.getElementById('node-doc');
        const nodePat = document.getElementById('node-pat');
        const log = document.getElementById('trigger-log');
        
        log.textContent = `Alerting Room & Patient...`;
        
        if (nodeDoc) {
          nodeDoc.classList.remove('firing-doc');
          void nodeDoc.offsetWidth; 
          nodeDoc.classList.add('firing-doc');
        }
        if (nodePat) {
          nodePat.classList.remove('firing-pat');
          void nodePat.offsetWidth; 
          nodePat.classList.add('firing-pat');
        }
        
        playTickSound();
        
        try {
          const response = await fetch('/api/trigger-checkmark', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              patientName: name,
              patientEmail: email,
              patientPhone: phone,
              purpose: purpose,
              doctorName: doctor,
              doctorEmail: docEmail
            })
          });
          const resData = await response.json();
          
          if (resData.success) {
            log.innerHTML = `<span style="color:var(--color-neon-green); font-weight:bold;">Dispatched!</span> Check feeds.`;
            renderDoctorEmail(name, purpose, email, phone);
            renderPatientSMS(name, doctor);
          }
        } catch (error) {
          console.warn('Backend server notification failed. Simulating locally...', error);
          log.innerHTML = `<span style="color:var(--color-gold); font-weight:bold;">Simulated.</span> Alerts sent.`;
          
          setTimeout(() => {
            renderDoctorEmail(name, purpose, email, phone);
            renderPatientSMS(name, doctor);
          }, 800);
        }
      }
    });
  });
}

function renderDoctorEmail(name, purpose, email, phone) {
  const docPanel = document.getElementById('doctor-email-content');
  if (!docPanel) return;
  
  docPanel.innerHTML = `
    <div class="doc-email-view" style="animation: slideIn 0.3s ease forwards;">
      <div class="doc-email-header">
        <div><span class="bold-label">Subject:</span> Patient Entering: ${name}</div>
        <div><span class="bold-label">From:</span> Raspion Intake Automator</div>
      </div>
      <div class="doc-email-body">
        <p><strong>Patient Name:</strong> ${name}</p>
        <p><strong>Phone:</strong> ${phone}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Reason for Visit:</strong> ${purpose}</p>
      </div>
      <div class="doc-email-actions" id="email-actions">
        <button class="doc-btn no-follow" onclick="completeDoctorAction('No Follow-up')">No Follow-up</button>
        <button class="doc-btn needs-follow" onclick="completeDoctorAction('Needs Follow-up')">Needs Follow-up</button>
      </div>
    </div>
  `;
}

function renderPatientSMS(name, doctor) {
  const smsPanel = document.getElementById('patient-sms-content');
  if (!smsPanel) return;
  
  smsPanel.innerHTML = `
    <div class="sms-bubble" style="animation: slideIn 0.3s ease forwards;">
      Hi ${name}, ${doctor} is ready to see you now. Please make your way into the doctor's room.
      <span class="sms-time">${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
    </div>
  `;
}

window.completeDoctorAction = function(decision) {
  const actionsContainer = document.getElementById('email-actions');
  if (actionsContainer) {
    actionsContainer.innerHTML = `
      <div class="email-action-logged">
        Logged: ${decision}
      </div>
    `;
    playChimeSound();
  }
};

// ==========================================
// FEATURE 2: Voice AI Simulator
// ==========================================
function initVoiceAiSimulator() {
  const startBtn = document.getElementById('start-call-btn');
  const statusLabel = document.getElementById('call-status');
  const waveform = document.getElementById('call-waveform');
  const transcript = document.getElementById('call-transcript');
  const syncIndicator = document.getElementById('voice-sync-indicator');
  
  if (!startBtn) return;
  
  let callActive = false;
  let textIndex = 0;
  let callTimer = null;
  
  const conversation = [
    { sender: 'ai', text: 'Raspion Clinic Reception, this is Sarah. How can I help you today?' },
    { sender: 'caller', text: 'Hello, I need to book a same-day checkup with Dr. Aditya. I have a really bad back ache.' },
    { sender: 'ai', text: 'I am sorry to hear that. I can certainly help. What is your full name please?' },
    { sender: 'caller', text: 'Robert Miller.' },
    { sender: 'ai', text: 'Thank you, Robert. I have an opening with Dr. Aditya at 11:30 AM today. Does that work for you?' },
    { sender: 'caller', text: 'Yes, that is perfect. 11:30 works.' },
    { sender: 'ai', text: 'Excellent. What is your contact phone number to secure this slot?' },
    { sender: 'caller', text: '+1 (555) 304-9271' },
    { sender: 'ai', text: 'Got it. I have booked you in for 11:30 AM. A confirmation text was sent to your number. See you shortly!' },
    { sender: 'caller', text: 'Thank you so much. Good-bye.' }
  ];
  
  startBtn.addEventListener('click', () => {
    if (!callActive) {
      callActive = true;
      textIndex = 0;
      startBtn.classList.add('active');
      startBtn.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M14.25 9v6m-4.5 0V9M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      `;
      statusLabel.textContent = 'Active Call - Connected';
      statusLabel.style.color = 'var(--color-neon-red)';
      waveform.classList.remove('hidden');
      transcript.innerHTML = '';
      syncIndicator.classList.add('hidden');
      
      playCallConnectedSound();
      runCallDialogue();
    } else {
      endCall();
    }
  });
  
  function runCallDialogue() {
    if (textIndex >= conversation.length) {
      setTimeout(() => {
        triggerVoiceSync();
      }, 1000);
      return;
    }
    
    const turn = conversation[textIndex];
    const bubble = document.createElement('div');
    bubble.className = `bubble ${turn.sender}`;
    bubble.textContent = turn.text;
    bubble.style.animation = "slideIn 0.3s ease forwards";
    transcript.appendChild(bubble);
    transcript.scrollTop = transcript.scrollHeight;
    
    playPopSound();
    
    textIndex++;
    callTimer = setTimeout(runCallDialogue, 2200);
  }
  
  function triggerVoiceSync() {
    waveform.classList.add('hidden');
    statusLabel.textContent = 'Call Disconnected';
    statusLabel.style.color = 'var(--text-muted)';
    syncIndicator.classList.remove('hidden');
    
    playChimeSound();
    
    setTimeout(() => {
      syncIndicator.classList.add('hidden');
      statusLabel.textContent = 'Click to test call';
      startBtn.classList.remove('active');
      startBtn.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-2.824-1.802-5.14-4.117-6.942-6.942l1.293-.97a1.125 1.125 0 00.417-1.173L6.963 3.102a1.125 1.125 0 00-1.11-1.008H4.5a2.25 2.25 0 00-2.25 2.25v1.372z" />
        </svg>
      `;
      callActive = false;
      
      addPatientToQueue({
        name: 'Robert Miller',
        phone: '+1 (555) 304-9271',
        purpose: 'Consultation: Bad back ache',
        created_at: new Date().toISOString()
      });
      appendSheetRow('Robert Miller', '+1 (555) 304-9271', 'Voice AI', 'Bad back ache');
    }, 1500);
  }
  
  function endCall() {
    clearTimeout(callTimer);
    callActive = false;
    waveform.classList.add('hidden');
    syncIndicator.classList.add('hidden');
    statusLabel.textContent = 'Call Disconnected';
    statusLabel.style.color = 'var(--text-muted)';
    startBtn.classList.remove('active');
    startBtn.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-2.824-1.802-5.14-4.117-6.942-6.942l1.293-.97a1.125 1.125 0 00.417-1.173L6.963 3.102a1.125 1.125 0 00-1.11-1.008H4.5a2.25 2.25 0 00-2.25 2.25v1.372z" />
      </svg>
    `;
    transcript.innerHTML = '<div class="empty-inbox-text">Call ended.</div>';
  }
}

// ==========================================
// FEATURE 3: SMS/WhatsApp Chat Simulator
// ==========================================
function initChatSimulator() {
  const chatInput = document.getElementById('chat-input');
  const sendBtn = document.getElementById('send-chat-btn');
  const chatMessages = document.getElementById('chat-messages');
  const sheetLog = document.getElementById('sheet-log');
  
  if (!sendBtn) return;
  
  const presets = document.querySelectorAll('.preset-btn');
  presets.forEach(btn => {
    btn.addEventListener('click', () => {
      chatInput.value = btn.dataset.text;
      chatInput.focus();
    });
  });
  
  sendBtn.addEventListener('click', handleChatSubmit);
  chatInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleChatSubmit();
  });
  
  function handleChatSubmit() {
    const text = chatInput.value.trim();
    if (!text) return;
    
    addChatBubble('outgoing', text);
    chatInput.value = '';
    
    playPopSound();
    
    sheetLog.textContent = 'AI parsing incoming message...';
    
    setTimeout(() => {
      const parsedData = parseBookingText(text);
      
      const reply = `Got it! I've extracted the details:
      👤 Name: ${parsedData.name}
      📞 Phone: ${parsedData.phone}
      📅 Purpose: ${parsedData.purpose}
      
      Your appointment is confirmed and added to our spreadsheet.`;
      
      addChatBubble('incoming', reply);
      playChimeSound();
      
      appendSheetRow(parsedData.name, parsedData.phone, 'SMS/WhatsApp', parsedData.purpose);
      sheetLog.innerHTML = `<span style="color:var(--color-neon-green); font-weight:bold;">Parsed!</span> Added ${parsedData.name} to database.`;
      
      addPatientToQueue({
        name: parsedData.name,
        phone: parsedData.phone,
        purpose: 'Booking: ' + parsedData.purpose,
        created_at: new Date().toISOString()
      });
    }, 1500);
  }
  
  function addChatBubble(direction, text) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${direction}`;
    
    messageDiv.innerHTML = `
      <div class="msg-bubble" style="animation: slideIn 0.3s ease forwards;">
        ${text.replace(/\n/g, '<br>')}
        <span class="msg-time">${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
      </div>
    `;
    
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }
  
  function parseBookingText(str) {
    let name = "Unknown Guest";
    let phone = "+1 (555) 998-3829";
    let purpose = "Consultation/Inquiry";
    
    const nameMatch = str.match(/for\s+([A-Z][a-z]+\s+[A-Z][a-z]+|[A-Z][a-z]+)/i);
    if (nameMatch) name = nameMatch[1];
    
    const purposeMatch = str.match(/for\s+(.*?)(\.|\s+tomorrow|\s+Friday|$)/i);
    if (purposeMatch && purposeMatch[1].length > 4 && !purposeMatch[1].includes("for")) {
      purpose = purposeMatch[1];
    } else if (str.toLowerCase().includes("shoulder")) {
      purpose = "Shoulder pain check";
    } else if (str.toLowerCase().includes("follow-up")) {
      purpose = "Follow-up check";
    }
    
    return { name, phone, purpose };
  }
}

function appendSheetRow(name, phone, source, purpose) {
  const rows = document.getElementById('sheet-rows');
  if (!rows) return;
  
  const timeStr = new Date().toISOString().slice(0, 16).replace('T', ' ');
  const badgeClass = source.includes('Voice') ? 'green' : 'purple';
  
  const newRow = document.createElement('tr');
  newRow.style.animation = "slideIn 0.5s ease forwards, flashGreen 1s ease";
  newRow.innerHTML = `
    <td class="timestamp-cell">${timeStr}</td>
    <td><strong>${name}</strong></td>
    <td>${phone}</td>
    <td><span class="s-badge ${badgeClass}">${source}</span></td>
    <td>${purpose}</td>
    <td><span class="s-badge blue">Waiting</span></td>
  `;
  
  rows.appendChild(newRow);
  
  const wrapper = rows.closest('.sheet-table-wrapper');
  if (wrapper) wrapper.scrollTop = wrapper.scrollHeight;
}

// Helper to extract YouTube video ID
function getYouTubeId(url) {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=|shorts\/)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
}

// ==========================================
// MEDIA GALLERY: Load from Supabase (Video loop support)
// ==========================================
async function loadGallery(supabase) {
  const grid = document.getElementById('public-gallery-grid');
  if (!grid) return;
  
  let mediaItems = [];
  let cloudItems = [];
  
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('media')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (!error && data) {
        cloudItems = data;
      }
    } catch (err) {
      console.warn('Failed to load gallery from database, falling back to local sync.', err);
    }
  }

  // Load from local storage
  let localItems = [];
  try {
    const list = localStorage.getItem('raspion_local_media');
    if (list) localItems = JSON.parse(list);
  } catch (e) {
    console.warn('Failed to load local media:', e);
  }

  // Merge cloud, local, and session items uniquely
  const mergedMap = new Map();
  localItems.forEach(item => mergedMap.set(item.id, item));
  cloudItems.forEach(item => mergedMap.set(item.id, item));
  if (window.temp_media_items) {
    window.temp_media_items.forEach(item => mergedMap.set(item.id, item));
  }

  // Sort descending by created_at
  mediaItems = Array.from(mergedMap.values())
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  
  // Fallback to static items if empty
  if (mediaItems.length === 0) {
    mediaItems = [
      {
        id: 'fallback-1',
        type: 'image',
        url: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=600&q=80',
        title: 'Raspion Touch Interface on Frontdesk Tablet'
      },
      {
        id: 'fallback-2',
        type: 'image',
        url: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=600&q=80',
        title: 'Integrated Voice AI Autopilot Call Logs'
      },
      {
        id: 'fallback-3',
        type: 'image',
        url: 'https://images.unsplash.com/photo-1581594693702-fbdc51b2763b?auto=format&fit=crop&w=600&q=80',
        title: 'Operations Reviewing Automated Patient Sheets'
      }
    ];
  }
  
  grid.innerHTML = '';
  mediaItems.forEach(item => {
    const card = document.createElement('div');
    card.className = 'media-card';
    
    let mediaHTML = '';
    const ytId = getYouTubeId(item.url);
    if (item.type === 'youtube' || ytId) {
      const videoId = ytId || item.url;
      mediaHTML = `<iframe src="https://www.youtube.com/embed/${videoId}?autoplay=0&mute=0&controls=1" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen style="width:100%; height:100%; border:none; display:block;" class="gallery-video-preview"></iframe>`;
    } else if (item.type === 'video' || item.url.endsWith('.mp4') || item.url.includes('video') || item.url.startsWith('data:video/')) {
      mediaHTML = `<video src="${item.url}" autoplay loop muted playsinline class="gallery-video-preview" style="width:100%; height:100%; object-fit:cover; display:block;"></video>`;
    } else {
      mediaHTML = `<img src="${item.url}" alt="${item.title || 'Practice Media'}">`;
    }
    
    card.innerHTML = `
      <div class="media-wrapper">
        ${mediaHTML}
      </div>
      <div class="media-title">${item.title || 'Practice Media'}</div>
    `;
    grid.appendChild(card);
  });
}

// ==========================================
// AUDIO SYNTHESIS: Pure Web Audio API
// ==========================================
let audioCtx = null;

function getAudioContext() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  return audioCtx;
}

function playTickSound() {
  try {
    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(800, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.1);
    
    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
    
    osc.start();
    osc.stop(ctx.currentTime + 0.1);
  } catch (e) {}
}

function playChimeSound() {
  try {
    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
    osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.1); // E5
    osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.2); // G5
    
    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.45);
    
    osc.start();
    osc.stop(ctx.currentTime + 0.5);
  } catch (e) {}
}

function playPopSound() {
  try {
    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(400, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.08);
    
    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.08);
    
    osc.start();
    osc.stop(ctx.currentTime + 0.08);
  } catch (e) {}
}

function playCallConnectedSound() {
  try {
    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(350, ctx.currentTime);
    osc.frequency.setValueAtTime(440, ctx.currentTime + 0.15);
    
    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
    
    osc.start();
    osc.stop(ctx.currentTime + 0.3);
  } catch (e) {}
}

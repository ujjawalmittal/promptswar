/**
 * CivicAQI - Frontend Orchestrator & State Management
 * Pure Vanilla JavaScript (ES6+)
 * Features: Gemini API Key & Streaming SSE Chat, Firebase Auth Login/Signup,
 *           RBAC Enforcement, Structured Table, 30-Min Local Sync
 */

document.addEventListener('DOMContentLoaded', () => {
  'use strict';

  const state = {
    userRole: 'ward_officer',
    pincode: '110085',
    language: 'en',
    lastSyncTime: Date.now(),
    syncIntervalMinutes: 30,
    previousBrief: null,
    latestAnalysis: null,
    uploadedImageBase64: null,
    geminiApiKey: localStorage.getItem('civic_gemini_key') || '',
    geminiModel: localStorage.getItem('civic_gemini_model') || 'gemini-2.5-flash',
    firebaseApiKey: localStorage.getItem('civic_firebase_key') || '',
    serviceAccountJson: localStorage.getItem('civic_sa_json') || '',
    gcpProjectId: localStorage.getItem('civic_gcp_project') || '',
    gcpLocation: localStorage.getItem('civic_gcp_location') || 'us-central1',
    serverAdcInfo: { adcDetected: false, adcSource: 'None', adcEmail: '', projectId: '' },
    serverHasGeminiKey: false,
    authMode: 'login',
    chatHistory: [],
    userProfile: {
      name: 'Er. Rajesh V. Sharma',
      email: 'officer@mcd.gov.in',
      role: 'ward_officer',
      designation: 'Ward Officer / Municipal Admin',
      authority: 'MCD Rohini Zone / DPCC',
      address: 'Sector 9 Civic Center, Rohini, Delhi',
      pincode: '110085',
      isAdmin: true
    }
  };

  const el = {
    rawTextInput: document.getElementById('rawTextInput'),
    pincodeInput: document.getElementById('pincodeInput'),
    roleSelect: document.getElementById('roleSelect'),
    langSelect: document.getElementById('langSelect'),
    btnAnalyze: document.getElementById('btnAnalyze'),
    btnSyncNow: document.getElementById('btnSyncNow'),
    syncTimeLabel: document.getElementById('syncTimeLabel'),
    fileInput: document.getElementById('fileInput'),
    imageInput: document.getElementById('imageInput'),
    imagePreview: document.getElementById('imagePreview'),
    dropzone: document.getElementById('dropzone'),

    engineStatusBadge: document.getElementById('engineStatusBadge'),
    headerUserLabel: document.getElementById('headerUserLabel'),
    rbacBadge: document.getElementById('rbacBadge'),
    ribbonUserSubtext: document.getElementById('ribbonUserSubtext'),
    actionPrivilegeNote: document.getElementById('actionPrivilegeNote'),

    ribbonAqiVal: document.getElementById('ribbonAqiVal'),
    ribbonAqiCategory: document.getElementById('ribbonAqiCategory'),
    ribbonGovStation: document.getElementById('ribbonGovStation'),
    ribbonGovVal: document.getElementById('ribbonGovVal'),
    ribbonDeltaVal: document.getElementById('ribbonDeltaVal'),
    ribbonDeltaText: document.getElementById('ribbonDeltaText'),
    ribbonPrimaryPollutant: document.getElementById('ribbonPrimaryPollutant'),

    briefingContainer: document.getElementById('briefingContainer'),
    briefingWordCount: document.getElementById('briefingWordCount'),
    dataGapsContainer: document.getElementById('dataGapsContainer'),
    normalizedTableBody: document.getElementById('normalizedTableBody'),

    trendCanvas: 'trendCanvas',
    pollutantCanvas: 'pollutantCanvas',

    hotspotContainer: document.getElementById('hotspotContainer'),
    actionListContainer: document.getElementById('actionListContainer'),
    clarificationContainer: document.getElementById('clarificationContainer'),
    authorityContactContainer: document.getElementById('authorityContactContainer'),
    historyListContainer: document.getElementById('historyListContainer'),
    btnRefreshHistory: document.getElementById('btnRefreshHistory'),

    advChildren: document.getElementById('advChildren'),
    advElderly: document.getElementById('advElderly'),
    advSensitive: document.getElementById('advSensitive'),
    advCommercial: document.getElementById('advCommercial'),
    advGeneral: document.getElementById('advGeneral'),

    // API Config Modal
    apiConfigModal: document.getElementById('apiConfigModal'),
    btnOpenApiConfig: document.getElementById('btnOpenApiConfig'),
    btnCloseApiConfig: document.getElementById('btnCloseApiConfig'),
    adcStatusBanner: document.getElementById('adcStatusBanner'),
    serviceAccountFile: document.getElementById('serviceAccountFile'),
    serviceAccountInput: document.getElementById('serviceAccountInput'),
    gcpProjectInput: document.getElementById('gcpProjectInput'),
    gcpLocationInput: document.getElementById('gcpLocationInput'),
    geminiKeyInput: document.getElementById('geminiKeyInput'),
    geminiModelSelect: document.getElementById('geminiModelSelect'),
    firebaseKeyInput: document.getElementById('firebaseKeyInput'),
    btnSaveApiConfig: document.getElementById('btnSaveApiConfig'),
    btnClearApiKeys: document.getElementById('btnClearApiKeys'),

    // Auth Modal
    authModal: document.getElementById('authModal'),
    btnOpenAuth: document.getElementById('btnOpenAuth'),
    btnCloseAuth: document.getElementById('btnCloseAuth'),
    tabLoginMode: document.getElementById('tabLoginMode'),
    tabSignupMode: document.getElementById('tabSignupMode'),
    signupFieldsContainer: document.getElementById('signupFieldsContainer'),
    authEmail: document.getElementById('authEmail'),
    authPassword: document.getElementById('authPassword'),
    authName: document.getElementById('authName'),
    authRole: document.getElementById('authRole'),
    authAuthority: document.getElementById('authAuthority'),
    authAddress: document.getElementById('authAddress'),
    authPincode: document.getElementById('authPincode'),
    authStatusMsg: document.getElementById('authStatusMsg'),
    btnSubmitAuth: document.getElementById('btnSubmitAuth'),
    btnDemoCitizen: document.getElementById('btnDemoCitizen'),

    // Escalate Modal
    escalateModal: document.getElementById('escalateModal'),
    btnCloseEscalate: document.getElementById('btnCloseEscalate'),
    escalateFormContent: document.getElementById('escalateFormContent'),
    btnConfirmDispatch: document.getElementById('btnConfirmDispatch'),

    // Chatbot Drawer
    chatbotFab: document.getElementById('chatbotFab'),
    chatbotDrawer: document.getElementById('chatbotDrawer'),
    btnCloseChat: document.getElementById('btnCloseChat'),
    chatMessages: document.getElementById('chatMessages'),
    chatInput: document.getElementById('chatInput'),
    btnSendChat: document.getElementById('btnSendChat'),
    chatEngineSub: document.getElementById('chatEngineSub')
  };

  async function init() {
    loadLocalProfile();
    await fetchServerConfig();
    updateEngineBadge();
    updateRbacUI();
    setupEventHandlers();
    loadSampleData('messyTable');
    await triggerAnalysis();
    await loadHistory();
    startSyncTicker();
  }

  async function fetchServerConfig() {
    try {
      const res = await fetch('/api/config');
      const cfg = await res.json();
      state.serverHasGeminiKey = cfg.hasServerGeminiKey;
      state.serverAdcInfo = {
        adcDetected: cfg.adcDetected,
        adcSource: cfg.adcSource,
        adcType: cfg.adcType,
        adcEmail: cfg.adcEmail,
        projectId: cfg.projectId,
        location: cfg.location
      };
      if (!state.gcpProjectId && cfg.projectId) state.gcpProjectId = cfg.projectId;
      if (!localStorage.getItem('civic_gcp_location') && cfg.location) state.gcpLocation = cfg.location;
      if (!localStorage.getItem('civic_gemini_model') && cfg.geminiModel) {
        state.geminiModel = cfg.geminiModel;
      }
    } catch (e) {}
  }

  function updateEngineBadge() {
    const hasAdc = Boolean(state.serviceAccountJson || state.serverAdcInfo?.adcDetected);
    const hasKey = Boolean(state.geminiApiKey || state.serverHasGeminiKey);
    if (hasAdc) {
      el.engineStatusBadge.innerText = `🟢 Vertex AI ADC (${state.geminiModel})`;
      el.engineStatusBadge.classList.add('live');
      el.chatEngineSub.innerText = `ADC Service Account: ${state.geminiModel} (SSE)`;
    } else if (hasKey) {
      el.engineStatusBadge.innerText = `🟢 Gemini Live (${state.geminiModel})`;
      el.engineStatusBadge.classList.add('live');
      el.chatEngineSub.innerText = `Connected: ${state.geminiModel} (SSE Streaming)`;
    } else {
      el.engineStatusBadge.innerText = '🟡 Local Heuristic';
      el.engineStatusBadge.classList.remove('live');
      el.chatEngineSub.innerText = 'Local Fallback Stream (Set ADC or Key in 🔑)';
    }
  }

  function updateRbacUI() {
    const isAdmin = state.userRole === 'super_admin' || state.userRole === 'ward_officer';
    el.headerUserLabel.innerText = `${state.userProfile.name.split(' ')[0]} (${state.userRole.replace('_', ' ')})`;
    el.rbacBadge.innerText = isAdmin ? 'ADMIN PRIVILEGE' : 'STANDARD / REQUEST';
    el.rbacBadge.style.background = isAdmin ? 'rgba(16, 185, 129, 0.2)' : 'rgba(234, 179, 8, 0.2)';
    el.rbacBadge.style.color = isAdmin ? '#34d399' : '#facc15';
    el.ribbonUserSubtext.innerText = `${state.userProfile.authority} • Pincode ${state.pincode}`;
    el.actionPrivilegeNote.innerText = isAdmin
      ? 'Admin Mode: Direct Body Assignment Enabled'
      : 'Non-Admin Mode: Submit Requests to Reasonable Bodies';
  }

  function loadLocalProfile() {
    const saved = localStorage.getItem('civic_user_profile');
    if (saved) {
      try {
        state.userProfile = JSON.parse(saved);
        state.userRole = state.userProfile.role || 'ward_officer';
        state.pincode = state.userProfile.pincode || '110085';
      } catch (e) {}
    }
    el.roleSelect.value = state.userRole;
    el.pincodeInput.value = state.pincode;
  }

  function setupEventHandlers() {
    el.btnAnalyze.addEventListener('click', () => triggerAnalysis());
    el.btnSyncNow.addEventListener('click', () => {
      state.lastSyncTime = Date.now();
      triggerAnalysis();
      loadHistory();
    });

    el.roleSelect.addEventListener('change', () => {
      state.userRole = el.roleSelect.value;
      updateRbacUI();
      triggerAnalysis();
    });

    el.langSelect.addEventListener('change', () => {
      state.language = el.langSelect.value;
      triggerAnalysis();
    });

    el.pincodeInput.addEventListener('change', () => {
      state.pincode = el.pincodeInput.value.trim() || '110085';
      updateRbacUI();
      triggerAnalysis();
    });

    document.querySelectorAll('.sample-chip[data-sample]').forEach(chip => {
      chip.addEventListener('click', () => {
        loadSampleData(chip.getAttribute('data-sample'));
        triggerAnalysis();
      });
    });

    // Input Tabs
    document.querySelectorAll('.tab-btn[data-tab]').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.tab-btn[data-tab]').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const tab = btn.getAttribute('data-tab');
        if (tab === 'paste') {
          el.rawTextInput.style.display = 'block';
          el.dropzone.style.display = 'none';
        } else if (tab === 'file') {
          el.rawTextInput.style.display = 'none';
          el.dropzone.style.display = 'flex';
          el.fileInput.click();
        } else if (tab === 'image') {
          el.rawTextInput.style.display = 'none';
          el.dropzone.style.display = 'flex';
          el.imageInput.click();
        }
      });
    });

    el.fileInput.addEventListener('change', e => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = ev => {
        el.rawTextInput.value = ev.target.result;
        el.rawTextInput.style.display = 'block';
        el.dropzone.style.display = 'none';
        triggerAnalysis();
      };
      reader.readAsText(file);
    });

    el.imageInput.addEventListener('change', e => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = ev => {
        state.uploadedImageBase64 = ev.target.result;
        el.imagePreview.src = state.uploadedImageBase64;
        el.imagePreview.style.display = 'block';
        el.rawTextInput.value = `[Uploaded Image: ${file.name}]\nExtract all AQI, PM2.5, PM10, and station values from this monitor photo.`;
        el.rawTextInput.style.display = 'block';
        triggerAnalysis();
      };
      reader.readAsDataURL(file);
    });

    // API & ADC Service Account Config Modal
    el.serviceAccountFile.addEventListener('change', e => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = ev => {
        el.serviceAccountInput.value = ev.target.result;
        try {
          const parsed = JSON.parse(ev.target.result);
          if (parsed.project_id) el.gcpProjectInput.value = parsed.project_id;
        } catch (err) {}
      };
      reader.readAsText(file);
    });

    el.btnOpenApiConfig.addEventListener('click', () => {
      const adc = state.serverAdcInfo;
      if (adc && adc.adcDetected) {
        el.adcStatusBanner.innerHTML = `<strong style="color:#10b981;">✓ Server ADC Detected</strong> (${adc.adcSource})<br>Account: <code>${adc.adcEmail || adc.adcType}</code> | Project: <code>${adc.projectId || 'Unset'}</code>`;
      } else if (state.serviceAccountJson) {
        el.adcStatusBanner.innerHTML = `<strong style="color:#10b981;">✓ Browser Service Account JSON Loaded</strong><br>Project: <code>${state.gcpProjectId || 'Auto'}</code>`;
      } else {
        el.adcStatusBanner.innerHTML = `<strong style="color:#f59e0b;">No Server ADC Found</strong> — Set <code>GOOGLE_APPLICATION_CREDENTIALS</code> in <code>.env</code> or upload/paste your Service Account JSON below.`;
      }
      el.serviceAccountInput.value = state.serviceAccountJson;
      el.gcpProjectInput.value = state.gcpProjectId;
      el.gcpLocationInput.value = state.gcpLocation;
      el.geminiKeyInput.value = state.geminiApiKey;
      el.geminiModelSelect.value = state.geminiModel;
      el.firebaseKeyInput.value = state.firebaseApiKey;
      el.apiConfigModal.classList.add('active');
    });
    el.btnCloseApiConfig.addEventListener('click', () => el.apiConfigModal.classList.remove('active'));
    el.btnSaveApiConfig.addEventListener('click', () => {
      state.serviceAccountJson = el.serviceAccountInput.value.trim();
      state.gcpProjectId = el.gcpProjectInput.value.trim();
      state.gcpLocation = el.gcpLocationInput.value.trim() || 'us-central1';
      if (state.serviceAccountJson && !state.gcpProjectId) {
        try {
          const parsed = JSON.parse(state.serviceAccountJson);
          if (parsed.project_id) state.gcpProjectId = parsed.project_id;
        } catch (e) {}
      }
      state.geminiApiKey = el.geminiKeyInput.value.trim();
      state.geminiModel = el.geminiModelSelect.value;
      state.firebaseApiKey = el.firebaseKeyInput.value.trim();
      localStorage.setItem('civic_sa_json', state.serviceAccountJson);
      localStorage.setItem('civic_gcp_project', state.gcpProjectId);
      localStorage.setItem('civic_gcp_location', state.gcpLocation);
      localStorage.setItem('civic_gemini_key', state.geminiApiKey);
      localStorage.setItem('civic_gemini_model', state.geminiModel);
      localStorage.setItem('civic_firebase_key', state.firebaseApiKey);
      updateEngineBadge();
      el.apiConfigModal.classList.remove('active');
      triggerAnalysis();
    });
    el.btnClearApiKeys.addEventListener('click', () => {
      state.serviceAccountJson = '';
      state.gcpProjectId = '';
      state.geminiApiKey = '';
      state.firebaseApiKey = '';
      localStorage.removeItem('civic_sa_json');
      localStorage.removeItem('civic_gcp_project');
      localStorage.removeItem('civic_gemini_key');
      localStorage.removeItem('civic_firebase_key');
      el.serviceAccountInput.value = '';
      el.gcpProjectInput.value = '';
      el.geminiKeyInput.value = '';
      el.firebaseKeyInput.value = '';
      updateEngineBadge();
    });

    // Firebase Auth Modal
    el.btnOpenAuth.addEventListener('click', () => {
      el.authEmail.value = state.userProfile.email || '';
      el.authName.value = state.userProfile.name || '';
      el.authRole.value = state.userRole;
      el.authAuthority.value = state.userProfile.authority || '';
      el.authAddress.value = state.userProfile.address || '';
      el.authPincode.value = state.pincode;
      el.authStatusMsg.innerText = '';
      el.authModal.classList.add('active');
    });
    el.btnCloseAuth.addEventListener('click', () => el.authModal.classList.remove('active'));

    el.tabLoginMode.addEventListener('click', () => {
      state.authMode = 'login';
      el.tabLoginMode.classList.add('active');
      el.tabSignupMode.classList.remove('active');
      el.signupFieldsContainer.style.display = 'none';
      el.btnSubmitAuth.innerText = 'Sign In';
    });
    el.tabSignupMode.addEventListener('click', () => {
      state.authMode = 'signup';
      el.tabSignupMode.classList.add('active');
      el.tabLoginMode.classList.remove('active');
      el.signupFieldsContainer.style.display = 'flex';
      el.btnSubmitAuth.innerText = 'Register & Sign In';
    });

    el.btnSubmitAuth.addEventListener('click', handleAuthSubmit);
    el.btnDemoCitizen.addEventListener('click', () => {
      state.userProfile = {
        name: 'Ananya Verma',
        email: 'ananya.resident@gmail.com',
        role: 'citizen',
        designation: 'Local Resident',
        authority: 'Rohini Sector 9 Residents',
        address: 'Block C-42, Rohini Sector 9, Delhi',
        pincode: '110085',
        isAdmin: false
      };
      applyUserProfile(state.userProfile);
      el.authModal.classList.remove('active');
    });

    // Escalate Modal
    el.btnCloseEscalate.addEventListener('click', () => el.escalateModal.classList.remove('active'));
    el.btnConfirmDispatch.addEventListener('click', handleDispatchEscalation);

    // History
    el.btnRefreshHistory.addEventListener('click', loadHistory);

    // Chatbot Drawer
    el.chatbotFab.addEventListener('click', () => el.chatbotDrawer.classList.toggle('open'));
    el.btnCloseChat.addEventListener('click', () => el.chatbotDrawer.classList.remove('open'));
    el.btnSendChat.addEventListener('click', () => sendChatMessage(el.chatInput.value));
    el.chatInput.addEventListener('keypress', e => {
      if (e.key === 'Enter') sendChatMessage(el.chatInput.value);
    });
    document.querySelectorAll('.sample-chip[data-chat]').forEach(chip => {
      chip.addEventListener('click', () => sendChatMessage(chip.getAttribute('data-chat')));
    });
  }

  function applyUserProfile(profile) {
    state.userProfile = profile;
    state.userRole = profile.role || 'citizen';
    state.pincode = profile.pincode || '110085';
    el.roleSelect.value = state.userRole;
    el.pincodeInput.value = state.pincode;
    localStorage.setItem('civic_user_profile', JSON.stringify(profile));
    updateRbacUI();
    triggerAnalysis();
  }

  async function handleAuthSubmit() {
    const endpoint = state.authMode === 'signup' ? '/api/auth/signup' : '/api/auth/login';
    el.authStatusMsg.innerText = 'Authenticating...';
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firebaseApiKey: state.firebaseApiKey,
          email: el.authEmail.value.trim(),
          password: el.authPassword.value,
          name: el.authName.value.trim(),
          role: el.authRole.value,
          designation: el.authRole.options[el.authRole.selectedIndex].text,
          authority: el.authAuthority.value.trim(),
          address: el.authAddress.value.trim(),
          pincode: el.authPincode.value.trim() || '110085'
        })
      });
      const data = await res.json();
      if (!data.success) {
        el.authStatusMsg.style.color = '#ef4444';
        el.authStatusMsg.innerText = `Error: ${data.error}`;
        return;
      }
      el.authStatusMsg.style.color = '#10b981';
      el.authStatusMsg.innerText = `Authenticated via ${data.authProvider}!`;
      applyUserProfile(data.user);
      setTimeout(() => el.authModal.classList.remove('active'), 600);
    } catch (e) {
      el.authStatusMsg.innerText = 'Network error during authentication.';
    }
  }

  function loadSampleData(key) {
    if (window.CivicMockData && window.CivicMockData[key]) {
      el.rawTextInput.value = window.CivicMockData[key];
    }
  }

  async function triggerAnalysis() {
    el.btnAnalyze.innerText = 'Analyzing...';
    el.btnAnalyze.disabled = true;

    const payload = {
      rawInput: el.rawTextInput.value,
      imageBase64: state.uploadedImageBase64,
      userRole: state.userRole,
      pincode: state.pincode,
      language: state.language,
      apiKey: state.geminiApiKey,
      serviceAccountJson: state.serviceAccountJson,
      projectId: state.gcpProjectId,
      location: state.gcpLocation,
      model: state.geminiModel,
      prevBrief: state.latestAnalysis ? { aqi: state.latestAnalysis.normalizedData.aqi } : null
    };

    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        state.previousBrief = state.latestAnalysis;
        state.latestAnalysis = data;
        state.lastSyncTime = Date.now();
        localStorage.setItem('civic_latest_brief', JSON.stringify(data));
        renderAnalysis(data);
        loadHistory();
      }
    } catch (err) {
      console.error('Analysis request error:', err);
    } finally {
      el.btnAnalyze.innerText = '✨ Process & Synthesize (AI)';
      el.btnAnalyze.disabled = false;
    }
  }

  function renderAnalysis(data) {
    const norm = data.normalizedData;
    const aqi = norm.aqi;

    el.ribbonAqiVal.innerText = aqi;
    el.ribbonAqiCategory.innerText = norm.category;
    el.ribbonAqiVal.style.color = CivicCharts.getAqiColor(aqi);

    el.ribbonGovStation.innerText = data.governmentComparison.stationName;
    el.ribbonGovVal.innerText = `${data.governmentComparison.officialAQI} AQI`;

    const delta = data.deltaComparison.change;
    el.ribbonDeltaVal.innerText = `${delta >= 0 ? '+' : ''}${delta}`;
    el.ribbonDeltaText.innerText = `${data.deltaComparison.percentage}% vs prev brief`;
    el.ribbonDeltaVal.style.color = delta > 0 ? 'var(--aqi-very-poor)' : 'var(--aqi-good)';

    const pm25Val = norm.metrics?.pm25?.value ?? '--';
    el.ribbonPrimaryPollutant.innerText = `${norm.primaryPollutant} (${pm25Val} µg/m³)`;

    el.briefingContainer.innerText = data.executiveBrief;
    el.briefingWordCount.innerText = `${data.wordCount} words • ${data.engine || 'Engine'}`;

    // Render Normalized Table
    renderNormalizedTable(norm.metrics);

    // Data Gaps
    if (norm.dataGaps && norm.dataGaps.length > 0) {
      el.dataGapsContainer.innerHTML = norm.dataGaps.map(gap => `
        <div style="background: rgba(249, 115, 22, 0.12); border-left: 3px solid #f97316; padding: 0.35rem 0.65rem; border-radius: 4px; font-size: 0.8rem; margin-top: 0.4rem;">
          <strong style="color: #f97316;">Data Gap:</strong> ${gap.parameter} — ${gap.observedIssue} (<em>${gap.recommendedAction}</em>)
        </div>
      `).join('');
    } else {
      el.dataGapsContainer.innerHTML = `<span style="color: var(--aqi-good); font-size: 0.8rem;">✓ Complete baseline pollutant metrics verified.</span>`;
    }

    renderCharts(data);
    renderHotspots(data.hotspots);
    renderActions(data.prioritizedActions);
    renderClarification(data.clarificationQuestions);
    renderAuthorityContact(data.responsibleContact);
    renderAdvisories(data.advisories);
  }

  function renderNormalizedTable(metrics) {
    if (!metrics) return;
    const rows = [
      { key: 'PM2.5', data: metrics.pm25 },
      { key: 'PM10', data: metrics.pm10 },
      { key: 'NO2', data: metrics.no2 },
      { key: 'SO2', data: metrics.so2 },
      { key: 'CO', data: metrics.co }
    ];
    el.normalizedTableBody.innerHTML = rows.map(r => {
      const m = r.data || { value: null, unit: '-', status: 'Missing', source: 'N/A' };
      const valDisplay = m.value !== null && m.value !== undefined ? m.value : '<span style="color:#f97316;">MISSING</span>';
      const badgeCls = m.status === 'Hazardous' || m.status === 'Severe' ? 'badge-severe'
                     : (m.status === 'Missing' || m.status === 'Elevated' || m.status === 'Poor' ? 'badge-poor' : 'badge-moderate');
      return `
        <tr>
          <td><strong>${r.key}</strong></td>
          <td>${valDisplay}</td>
          <td>${m.unit}</td>
          <td><span class="severity-badge ${badgeCls}">${m.status}</span></td>
          <td style="color: var(--text-muted); font-size: 0.78rem;">${m.source || 'Ingested Input'}</td>
        </tr>
      `;
    }).join('');
  }

  function renderCharts(data) {
    const trendLabels = ['04:00', '06:00', '08:00', '10:00', '12:00', '14:00', 'Now'];
    const baseAQI = data.normalizedData.aqi;
    const trendPoints = [
      Math.round(baseAQI * 0.78),
      Math.round(baseAQI * 0.88),
      Math.round(baseAQI * 1.05),
      Math.round(baseAQI * 0.98),
      Math.round(baseAQI * 0.92),
      Math.round(baseAQI * 0.95),
      baseAQI
    ];
    CivicCharts.renderLineTrend(el.trendCanvas, trendLabels, trendPoints);

    const m = data.normalizedData.metrics;
    const barItems = [
      { name: 'PM2.5', value: m.pm25?.value || 0, unit: 'µg/m³', safeLimit: 60 },
      { name: 'PM10', value: m.pm10?.value || 0, unit: 'µg/m³', safeLimit: 100 },
      { name: 'NO2', value: m.no2?.value || 0, unit: 'ppb', safeLimit: 80 },
      { name: 'CO', value: m.co?.value || 0, unit: 'mg/m³', safeLimit: 4.0 }
    ];
    CivicCharts.renderPollutantBars(el.pollutantCanvas, barItems);
  }

  function renderHotspots(hotspots) {
    if (!hotspots) return;
    el.hotspotContainer.innerHTML = hotspots.map(h => {
      const badgeClass = h.severity.toLowerCase().includes('severe') || h.severity.toLowerCase().includes('hazard') ? 'badge-severe' :
                         (h.severity.toLowerCase().includes('poor') ? 'badge-poor' : 'badge-moderate');
      return `
        <div class="hotspot-card">
          <div class="hotspot-header">
            <span class="hotspot-pincode">Pincode: ${h.pincode}</span>
            <span class="severity-badge ${badgeClass}">${h.severity}</span>
          </div>
          <div style="font-size: 0.85rem; font-weight: 600;">${h.areaName}</div>
          <div style="font-size: 1.1rem; font-weight: 800; color: ${CivicCharts.getAqiColor(h.aqi)}">${h.aqi} AQI</div>
          <div style="font-size: 0.75rem; color: var(--text-dim);">Source: ${h.suspectedSource}</div>
        </div>
      `;
    }).join('');
  }

  function renderActions(actions) {
    if (!actions) return;
    const isAdmin = state.userRole === 'super_admin' || state.userRole === 'ward_officer';
    const btnLabel = isAdmin ? '✅ Assign Action to Body' : '📨 Request Intervention from Body';

    const renderCard = (act, isP0) => `
      <div class="action-card ${isP0 ? 'priority-p0' : ''}">
        <div class="action-card-header">
          <span class="action-title">${act.title}</span>
          <span class="action-timeframe">${isP0 ? 'P0' : 'P1'} - ${act.timeframe}</span>
        </div>
        <div class="action-detail">${act.detail}</div>
        <div style="display:flex; justify-content:space-between; align-items:center; margin-top:0.4rem; flex-wrap:wrap; gap:0.4rem;">
          <span class="action-assigned">Body: ${act.assignedTo}</span>
          <button class="btn-secondary btn-assign-action" data-title="${act.title.replace(/"/g, '&quot;')}" data-body="${act.assignedTo.replace(/"/g, '&quot;')}" data-deadline="${act.timeframe}" style="padding: 0.25rem 0.6rem; font-size: 0.75rem;">
            ${btnLabel}
          </button>
        </div>
      </div>
    `;

    let html = '';
    (actions.immediateP0 || []).forEach(a => { html += renderCard(a, true); });
    (actions.precautionaryP1 || []).forEach(a => { html += renderCard(a, false); });
    el.actionListContainer.innerHTML = html;

    document.querySelectorAll('.btn-assign-action').forEach(btn => {
      btn.addEventListener('click', async () => {
        btn.disabled = true;
        btn.innerText = 'Submitting...';
        try {
          const res = await fetch('/api/assign-action', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userRole: state.userRole,
              assignedBy: state.userProfile.name,
              targetBody: btn.getAttribute('data-body'),
              actionTitle: btn.getAttribute('data-title'),
              deadline: btn.getAttribute('data-deadline'),
              pincode: state.pincode
            })
          });
          const data = await res.json();
          if (data.success) {
            btn.innerText = isAdmin ? `Assigned (${data.record.id})` : `Requested (${data.record.id})`;
            btn.style.borderColor = '#10b981';
            btn.style.color = '#10b981';
          }
        } catch (e) {
          btn.innerText = 'Failed';
        }
      });
    });
  }

  function renderClarification(questions) {
    if (!questions || questions.length === 0) {
      el.clarificationContainer.style.display = 'none';
      return;
    }
    el.clarificationContainer.style.display = 'flex';
    el.clarificationContainer.innerHTML = `
      <div class="clarification-title"><span>🔍 AI Clarification &amp; Gap Verification</span></div>
      ${questions.map(q => `
        <div class="question-item">
          <span>${q}</span>
          <div style="display: flex; gap: 0.3rem;">
            <button class="btn-secondary btn-ask-chat" data-q="Yes, regarding: ${q.replace(/"/g, '&quot;')}" style="padding: 0.2rem 0.5rem; font-size: 0.75rem;">Reply in Chat</button>
          </div>
        </div>
      `).join('')}
    `;
    document.querySelectorAll('.btn-ask-chat').forEach(btn => {
      btn.addEventListener('click', () => {
        el.chatbotDrawer.classList.add('open');
        sendChatMessage(btn.getAttribute('data-q'));
      });
    });
  }

  function renderAuthorityContact(contact) {
    if (!contact) return;
    el.authorityContactContainer.innerHTML = `
      <div style="background: #0b1120; border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: var(--space-md); display: flex; flex-direction: column; gap: var(--space-xs);">
        <div style="font-size: 0.95rem; font-weight: 700; color: var(--text-main);">${contact.authority}</div>
        <div style="font-size: 0.85rem; color: var(--text-muted);">Jurisdiction: <strong>${contact.ward}</strong></div>
        <div style="font-size: 0.85rem; color: var(--text-muted);">Responsible Officer: <strong>${contact.engineer}</strong></div>
        <div style="font-size: 0.85rem; color: var(--text-muted);">Emergency Desk: <strong>${contact.phone}</strong> | Email: <strong>${contact.email}</strong></div>
        <div style="margin-top: var(--space-xs);">
          <button class="btn-primary" style="font-size: 0.85rem; padding: 0.45rem 1rem;" id="btnOpenEscalateMemo">
            📝 Generate Formal Section 133 Escalation Notice
          </button>
        </div>
      </div>
    `;
    document.getElementById('btnOpenEscalateMemo').addEventListener('click', () => openEscalationModal(contact));
  }

  function openEscalationModal(contact) {
    const a = state.latestAnalysis;
    el.escalateFormContent.value = `FORMAL CIVIC DIRECTIVE & ENVIRONMENTAL NOTICE
Under Section 133 CrPC / Air (Prevention & Control of Pollution) Act 1981

TO: ${contact.engineer} (${contact.authority})
LOCATION: Pincode ${state.pincode} (${contact.ward})
DATE: ${new Date().toLocaleDateString()} | TIME: ${new Date().toLocaleTimeString()}

OBSERVED CRITICAL THRESHOLD:
Ambient AQI: ${a.normalizedData.aqi} (${a.normalizedData.category}) | PM2.5: ${a.normalizedData.metrics.pm25?.value} µg/m³
Official Benchmark: ${a.governmentComparison.stationName} (${a.governmentComparison.officialAQI} AQI)

ISSUED BY: ${state.userProfile.name} (${state.userProfile.designation}, ${state.userProfile.authority})
ADDRESS: ${state.userProfile.address}`;
    el.escalateModal.classList.add('active');
  }

  async function handleDispatchEscalation() {
    el.btnConfirmDispatch.innerText = 'Transmitting...';
    try {
      const res = await fetch('/api/escalate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pincode: state.pincode, officer: state.userProfile.authority })
      });
      const data = await res.json();
      if (data.success) {
        alert(`Notice Dispatched!\nReference: ${data.ticketId}\nStatus: ${data.status}`);
        el.escalateModal.classList.remove('active');
      }
    } catch (e) {
      alert('Failed to transmit escalation notice.');
    } finally {
      el.btnConfirmDispatch.innerText = 'Dispatch Notice to Municipal Authorities';
    }
  }

  function renderAdvisories(adv) {
    if (!adv) return;
    el.advChildren.innerText = adv.children || '--';
    el.advElderly.innerText = adv.olderAdults || '--';
    el.advSensitive.innerText = adv.sensitivePatients || '--';
    el.advCommercial.innerText = adv.commercial || '--';
    el.advGeneral.innerText = adv.general || '--';
  }

  async function loadHistory() {
    try {
      const res = await fetch('/api/history');
      const list = await res.json();
      if (!Array.isArray(list) || list.length === 0) {
        el.historyListContainer.innerHTML = '<p style="font-size:0.8rem; color:var(--text-dim);">No recorded briefs yet.</p>';
        return;
      }
      el.historyListContainer.innerHTML = list.slice(0, 8).map(item => `
        <div class="history-item">
          <div>
            <strong>Pincode ${item.pincode}</strong> — <span style="color:${CivicCharts.getAqiColor(item.aqi)}; font-weight:700;">${item.aqi} AQI (${item.category})</span>
            <div style="font-size:0.72rem; color:var(--text-dim);">${new Date(item.timestamp).toLocaleString()}</div>
          </div>
          <span style="font-size:0.72rem; color:var(--civic-cyan);">${item.primaryPollutant}</span>
        </div>
      `).join('');
    } catch (e) {}
  }

  // SSE Streaming Chatbot
  async function sendChatMessage(text) {
    const clean = (text || '').trim();
    if (!clean) return;
    el.chatInput.value = '';

    // Append User Bubble
    state.chatHistory.push({ sender: 'user', text: clean });
    const userDiv = document.createElement('div');
    userDiv.className = 'chat-bubble user';
    userDiv.innerText = clean;
    el.chatMessages.appendChild(userDiv);

    // Append Empty AI Bubble for Streaming
    const aiDiv = document.createElement('div');
    aiDiv.className = 'chat-bubble ai';
    aiDiv.innerText = '▌';
    el.chatMessages.appendChild(aiDiv);
    el.chatMessages.scrollTop = el.chatMessages.scrollHeight;

    const context = {
      userRole: state.userRole,
      userName: state.userProfile.name,
      pincode: state.pincode,
      aqi: state.latestAnalysis?.normalizedData?.aqi,
      category: state.latestAnalysis?.normalizedData?.category,
      primaryPollutant: state.latestAnalysis?.normalizedData?.primaryPollutant,
      govStation: state.latestAnalysis?.governmentComparison?.stationName,
      authority: state.latestAnalysis?.responsibleContact?.authority,
      executiveBrief: state.latestAnalysis?.executiveBrief
    };

    try {
      const response = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiKey: state.geminiApiKey,
          serviceAccountJson: state.serviceAccountJson,
          projectId: state.gcpProjectId,
          location: state.gcpLocation,
          model: state.geminiModel,
          messages: state.chatHistory,
          context
        })
      });

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullReply = '';
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop();

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const evt = JSON.parse(line.slice(6));
              if (evt.error) {
                fullReply += `\n[Error: ${evt.error}]`;
              } else if (evt.chunk) {
                fullReply += evt.chunk;
                aiDiv.innerText = fullReply + ' ▌';
                el.chatMessages.scrollTop = el.chatMessages.scrollHeight;
              } else if (evt.done) {
                aiDiv.innerText = fullReply;
              }
            } catch (e) {}
          }
        }
      }
      aiDiv.innerText = fullReply || 'No response received.';
      state.chatHistory.push({ sender: 'ai', text: fullReply });
    } catch (err) {
      aiDiv.innerText = 'Error connecting to streaming assistant.';
    }
  }

  function startSyncTicker() {
    setInterval(() => {
      const elapsedMins = Math.floor((Date.now() - state.lastSyncTime) / 60000);
      if (elapsedMins >= state.syncIntervalMinutes) {
        state.lastSyncTime = Date.now();
        triggerAnalysis();
      } else {
        el.syncTimeLabel.innerText = `Synced ${elapsedMins}m ago`;
      }
    }, 10000);
  }

  init();
});

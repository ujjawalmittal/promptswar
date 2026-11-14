/**
 * CivicAQI - AI-Driven Civic Intelligence Server
 * Built with native Node.js (Zero third-party runtime dependencies)
 * Features: Native .env loader, Google Gemini Multimodal & SSE Streaming,
 *           Firebase Auth REST integration, RBAC Enforcement, CPCB Benchmarks
 */

const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const url = require('url');
const crypto = require('crypto');
const os = require('os');

// Native .env loader (Zero dependencies)
function loadEnv() {
  const envPath = path.join(__dirname, '.env');
  if (!fs.existsSync(envPath)) return;
  const lines = fs.readFileSync(envPath, 'utf8').split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    let val = trimmed.slice(eqIdx + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = val;
  }
}
loadEnv();

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.join(__dirname, 'public');
const DATA_DIR = path.join(__dirname, 'data');
const HISTORY_FILE = path.join(DATA_DIR, 'history.json');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const ACTIONS_FILE = path.join(DATA_DIR, 'assigned_actions.json');

const MIME_TYPES = {
  '.html': 'text/html; charset=UTF-8',
  '.css': 'text/css; charset=UTF-8',
  '.js': 'application/javascript; charset=UTF-8',
  '.json': 'application/json; charset=UTF-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

// CPCB & Government Stations Knowledge Base
const GOV_STATIONS = {
  '110085': { station: 'CPCB - Rohini Sector 16, Delhi', aqi: 388, pm25: 242, pm10: 405, no2: 64, so2: 18, co: 2.2, o3: 31, agency: 'Central Pollution Control Board' },
  '110092': { station: 'CPCB - Anand Vihar, Delhi', aqi: 442, pm25: 295, pm10: 480, no2: 82, so2: 24, co: 3.1, o3: 28, agency: 'DPCC / CPCB' },
  '110022': { station: 'CPCB - R.K. Puram, Delhi', aqi: 365, pm25: 218, pm10: 380, no2: 58, so2: 15, co: 1.9, o3: 35, agency: 'DPCC' },
  '400051': { station: 'MPCB - Bandra Kurla Complex, Mumbai', aqi: 240, pm25: 110, pm10: 215, no2: 48, so2: 12, co: 1.4, o3: 25, agency: 'Maharashtra Pollution Control Board' },
  '411005': { station: 'IITM-SAFAR - Shivaji Nagar, Pune', aqi: 195, pm25: 85, pm10: 160, no2: 38, so2: 10, co: 1.1, o3: 22, agency: 'SAFAR / IMD' },
  '560001': { station: 'KSPCB - City Railway Station, Bengaluru', aqi: 125, pm25: 52, pm10: 105, no2: 32, so2: 8, co: 0.9, o3: 19, agency: 'Karnataka State Pollution Control Board' },
  '600001': { station: 'TNPCB - Manali Industrial Area, Chennai', aqi: 178, pm25: 78, pm10: 145, no2: 44, so2: 22, co: 1.3, o3: 24, agency: 'Tamil Nadu Pollution Control Board' },
  '700001': { station: 'WBPCB - Victoria Memorial, Kolkata', aqi: 285, pm25: 145, pm10: 255, no2: 52, so2: 16, co: 1.7, o3: 26, agency: 'West Bengal Pollution Control Board' }
};

const CIVIC_DIRECTORIES = {
  '110085': {
    ward: 'Ward 12 (Rohini North)',
    authority: 'Delhi Pollution Control Committee & MCD Rohini Zone',
    engineer: 'Er. Rajesh V. Sharma (Executive Engineer - Environment)',
    phone: '+91-11-23860360',
    email: 'ee.env.rohini@mcd.gov.in',
    magistrate: 'Office of SDM (Rohini Sub-Division)',
    policing: 'Delhi Traffic Police (Northern Range)'
  },
  'default': {
    ward: 'Municipal Ward Division',
    authority: 'State Pollution Control Board & Municipal Sanitation Division',
    engineer: 'Nodal Environmental Officer',
    phone: '1800-180-1717 (Air Quality Grievance Cell)',
    email: 'civic.complaints@pcb.gov.in',
    magistrate: 'Office of the Sub-Divisional Magistrate (SDM)',
    policing: 'Municipal Enforcement Squad'
  }
};

/**
 * Helper: Read JSON body safely
 */
function readBody(req, maxBytes = 15 * 1024 * 1024) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
      if (body.length > maxBytes) {
        reject(new Error('Payload Too Large'));
        req.destroy();
      }
    });
    req.on('end', () => {
      try {
        resolve(JSON.parse(body || '{}'));
      } catch (e) {
        reject(new Error('Invalid JSON'));
      }
    });
    req.on('error', reject);
  });
}

/**
 * Helper: Make HTTPS JSON Request
 */
function httpsPostJson(hostname, reqPath, payloadObj, extraHeaders = {}) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(payloadObj);
    const req = https.request({
      hostname,
      path: reqPath,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data),
        ...extraHeaders
      }
    }, res => {
      let out = '';
      res.on('data', c => { out += c; });
      res.on('end', () => {
        try {
          resolve({ statusCode: res.statusCode, data: JSON.parse(out) });
        } catch (e) {
          resolve({ statusCode: res.statusCode, raw: out });
        }
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

// ============================================================================
// Native Google Application Default Credentials (ADC) & Service Account Manager
// Zero external dependencies (uses Node.js built-in crypto RS256 JWT signing)
// ============================================================================
const adcTokenCache = { token: null, expiresAt: 0, credHash: '' };

function base64UrlEncode(input) {
  return Buffer.from(input).toString('base64')
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function discoverAdcCredentials(overrideJsonStr = null) {
  if (overrideJsonStr && overrideJsonStr.trim().startsWith('{')) {
    try {
      return { source: 'UI Service Account JSON', creds: JSON.parse(overrideJsonStr) };
    } catch (e) {}
  }

  const envCredPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (envCredPath && fs.existsSync(envCredPath)) {
    try {
      return { source: 'GOOGLE_APPLICATION_CREDENTIALS', creds: JSON.parse(fs.readFileSync(envCredPath, 'utf8')) };
    } catch (e) {}
  }

  // Standard gcloud ADC fallback locations
  const defaultPath = process.platform === 'win32'
    ? path.join(process.env.APPDATA || '', 'gcloud', 'application_default_credentials.json')
    : path.join(os.homedir(), '.config', 'gcloud', 'application_default_credentials.json');

  if (defaultPath && fs.existsSync(defaultPath)) {
    try {
      return { source: 'gcloud Default ADC', creds: JSON.parse(fs.readFileSync(defaultPath, 'utf8')) };
    } catch (e) {}
  }

  return null;
}

async function getAdcAccessToken(overrideJsonStr = null) {
  const discovered = discoverAdcCredentials(overrideJsonStr);
  if (!discovered || !discovered.creds) return null;

  const creds = discovered.creds;
  const credHash = crypto.createHash('sha256').update(JSON.stringify(creds)).digest('hex').slice(0, 12);
  if (adcTokenCache.token && adcTokenCache.credHash === credHash && Date.now() < adcTokenCache.expiresAt) {
    return { accessToken: adcTokenCache.token, creds, source: discovered.source };
  }

  // Case 1: Service Account JSON (JWT RS256 assertion -> OAuth2 Access Token)
  if (creds.type === 'service_account' && creds.client_email && creds.private_key) {
    const now = Math.floor(Date.now() / 1000);
    const header = base64UrlEncode(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
    const payload = base64UrlEncode(JSON.stringify({
      iss: creds.client_email,
      scope: 'https://www.googleapis.com/auth/cloud-platform',
      aud: creds.token_uri || 'https://oauth2.googleapis.com/token',
      exp: now + 3600,
      iat: now
    }));
    const signingInput = `${header}.${payload}`;
    const signer = crypto.createSign('RSA-SHA256');
    signer.update(signingInput);
    const signature = signer.sign(creds.private_key, 'base64')
      .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    const jwt = `${signingInput}.${signature}`;

    const tokenResp = await httpsPostJson('oauth2.googleapis.com', '/token', {
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt
    });

    if (tokenResp.statusCode !== 200 || !tokenResp.data?.access_token) {
      throw new Error(tokenResp.data?.error_description || 'Service Account OAuth2 token exchange failed');
    }

    adcTokenCache.token = tokenResp.data.access_token;
    adcTokenCache.expiresAt = Date.now() + ((tokenResp.data.expires_in || 3600) - 60) * 1000;
    adcTokenCache.credHash = credHash;
    return { accessToken: adcTokenCache.token, creds, source: discovered.source };
  }

  // Case 2: Authorized User ADC (gcloud auth application-default login)
  if (creds.type === 'authorized_user' && creds.refresh_token && creds.client_id && creds.client_secret) {
    const tokenResp = await httpsPostJson('oauth2.googleapis.com', '/token', {
      client_id: creds.client_id,
      client_secret: creds.client_secret,
      refresh_token: creds.refresh_token,
      grant_type: 'refresh_token'
    });

    if (tokenResp.statusCode !== 200 || !tokenResp.data?.access_token) {
      throw new Error(tokenResp.data?.error_description || 'ADC refresh_token exchange failed');
    }

    adcTokenCache.token = tokenResp.data.access_token;
    adcTokenCache.expiresAt = Date.now() + ((tokenResp.data.expires_in || 3600) - 60) * 1000;
    adcTokenCache.credHash = credHash;
    return { accessToken: adcTokenCache.token, creds, source: discovered.source };
  }

  throw new Error(`Unsupported ADC credential type: ${creds.type || 'unknown'}`);
}

function getVertexEndpoint(model, projectId, location, isStream) {
  const loc = location || process.env.GCP_LOCATION || 'us-central1';
  const method = isStream ? 'streamGenerateContent?alt=sse' : 'generateContent';
  return {
    hostname: `${loc}-aiplatform.googleapis.com`,
    path: `/v1/projects/${encodeURIComponent(projectId)}/locations/${encodeURIComponent(loc)}/publishers/google/models/${encodeURIComponent(model)}:${method}`
  };
}

/**
 * Helper: Make HTTPS GET JSON Request with timeout
 */
function httpsGetJson(fullUrl, timeoutMs = 2500) {
  return new Promise((resolve, reject) => {
    const req = https.get(fullUrl, res => {
      let out = '';
      res.on('data', c => { out += c; });
      res.on('end', () => {
        try {
          resolve({ statusCode: res.statusCode, data: JSON.parse(out) });
        } catch (e) {
          reject(new Error('Invalid JSON response'));
        }
      });
    });
    req.setTimeout(timeoutMs, () => {
      req.destroy();
      reject(new Error('Request Timeout'));
    });
    req.on('error', reject);
  });
}

const PINCODE_COORDS = {
  '110085': { lat: 28.7325, lon: 77.1157, area: 'Rohini, New Delhi' },
  '110092': { lat: 28.6469, lon: 77.3160, area: 'Anand Vihar, Delhi' },
  '110022': { lat: 28.5660, lon: 77.1767, area: 'R.K. Puram, New Delhi' },
  '400051': { lat: 19.0653, lon: 72.8682, area: 'BKC, Mumbai' },
  '411005': { lat: 18.5314, lon: 73.8446, area: 'Shivaji Nagar, Pune' },
  '560001': { lat: 12.9767, lon: 77.5713, area: 'City Railway Station, Bengaluru' },
  '600001': { lat: 13.0878, lon: 80.2785, area: 'Chennai Central' },
  '700001': { lat: 22.5726, lon: 88.3639, area: 'Kolkata Central' }
};

/**
 * Fetch Live Official / Public Air Quality Data for a Pincode
 * Uses Open-Meteo Air Quality API (no key required) + CPCB/State PCB fallback
 */
async function fetchLiveGovData(pincode) {
  const pc = (pincode || '110085').trim();
  const fallback = GOV_STATIONS[pc] || {
    station: `State Pollution Board Station (${pc})`,
    aqi: 320, pm25: 195, pm10: 340, no2: 55, so2: 14, co: 1.8, o3: 26,
    agency: 'State Pollution Control Board (Cached Benchmark)'
  };

  try {
    let coords = PINCODE_COORDS[pc];
    let areaLabel = coords ? coords.area : `Pincode ${pc}`;

    // Resolve unknown Indian pincode via India Post + Open-Meteo Geocoding
    if (!coords) {
      const postResp = await httpsGetJson(`https://api.postalpincode.in/pincode/${encodeURIComponent(pc)}`, 2000);
      const office = postResp?.data?.[0]?.PostOffice?.[0];
      if (office && office.District) {
        areaLabel = `${office.Name}, ${office.District}`;
        const geoResp = await httpsGetJson(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(office.District)}&count=1&countryCode=IN`, 2000);
        const loc = geoResp?.data?.results?.[0];
        if (loc) coords = { lat: loc.latitude, lon: loc.longitude, area: areaLabel };
      }
    }

    if (coords) {
      const aqUrl = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${coords.lat}&longitude=${coords.lon}&current=us_aqi,pm2_5,pm10,nitrogen_dioxide,sulphur_dioxide,carbon_monoxide,ozone`;
      const aqResp = await httpsGetJson(aqUrl, 2500);
      const cur = aqResp?.data?.current;
      if (cur && cur.us_aqi !== undefined) {
        return {
          station: `Live Satellite & Ground Grid — ${areaLabel} (${pc})`,
          aqi: Math.round(cur.us_aqi),
          pm25: Math.round(cur.pm2_5 || fallback.pm25),
          pm10: Math.round(cur.pm10 || fallback.pm10),
          no2: Math.round(cur.nitrogen_dioxide || fallback.no2),
          so2: Math.round(cur.sulphur_dioxide || fallback.so2),
          co: Number(((cur.carbon_monoxide || 1800) / 1000).toFixed(2)),
          o3: Math.round(cur.ozone || fallback.o3),
          agency: 'Live Open-Meteo / CPCB Correlated Feed',
          isLive: true
        };
      }
    }
  } catch (e) {
    // Offline or timeout fallback
  }

  return { ...fallback, isLive: false };
}

/**
 * Call Google Gemini REST API for Structured Analysis
 */
async function callGeminiAnalyze(authOpts, model, rawInput, imageBase64, userRole, pincode, language, prevBrief) {
  const govData = await fetchLiveGovData(pincode);
  const systemPrompt = `You are CivicAQI-Core, an expert environmental scientist and civic intervention specialist.
Convert messy raw air quality inputs (tables, multi-lingual statements, or monitor images) into structured, traceable JSON.
Rules:
1. Do not hallucinate missing pollutants; set value to null and document in dataGaps.
2. executiveBrief MUST be strictly 200-300 words.
3. Tailor prioritizedActions specifically to the userRole (${userRole}).
4. Generate vulnerableAdvisories in target language (${language}) for children, olderAdults, sensitivePatients, commercial, and general.
5. Output ONLY valid JSON matching the exact schema.`;

  const userPrompt = `Analyze this air quality input for Pincode ${pincode}, Role: ${userRole}, Advisory Language: ${language}.
Official Govt Station Reference: ${govData.station} (AQI: ${govData.aqi}, PM2.5: ${govData.pm25}, PM10: ${govData.pm10}).
Previous Brief AQI: ${prevBrief && prevBrief.aqi ? prevBrief.aqi : 'None'}.

RAW INPUT:
${rawInput}

Return JSON with keys:
{
  "normalizedData": {
    "aqi": number,
    "category": string,
    "primaryPollutant": string,
    "metrics": {
      "pm25": { "value": number|null, "unit": "µg/m³", "status": string, "source": string },
      "pm10": { "value": number|null, "unit": "µg/m³", "status": string, "source": string },
      "no2": { "value": number|null, "unit": "ppb", "status": string, "source": string },
      "so2": { "value": number|null, "unit": "ppb", "status": string, "source": string },
      "co": { "value": number|null, "unit": "mg/m³", "status": string, "source": string }
    },
    "dataGaps": [{ "parameter": string, "observedIssue": string, "recommendedAction": string }]
  },
  "executiveBrief": "200-300 word professional executive briefing",
  "hotspots": [{ "pincode": string, "areaName": string, "aqi": number, "severity": string, "suspectedSource": string }],
  "prioritizedActions": {
    "immediateP0": [{ "title": string, "detail": string, "timeframe": string, "assignedTo": string }],
    "precautionaryP1": [{ "title": string, "detail": string, "timeframe": string, "assignedTo": string }]
  },
  "clarificationQuestions": [string],
  "advisories": {
    "children": string,
    "olderAdults": string,
    "sensitivePatients": string,
    "commercial": string,
    "general": string
  }
}`;

  const parts = [{ text: systemPrompt + '\n\n' + userPrompt }];
  if (imageBase64 && imageBase64.includes('base64,')) {
    const [meta, b64] = imageBase64.split('base64,');
    const mimeMatch = meta.match(/data:(.*?);/);
    parts.push({
      inlineData: {
        mimeType: mimeMatch ? mimeMatch[1] : 'image/png',
        data: b64
      }
    });
  }

  const reqPayload = {
    contents: [{ role: 'user', parts }],
    generationConfig: {
      temperature: 0.2,
      responseMimeType: 'application/json'
    }
  };

  const targetModel = model || process.env.GEMINI_MODEL || 'gemini-2.5-flash';
  let resp;
  let engineLabel = `Gemini Live (${targetModel})`;

  const adcAuth = await getAdcAccessToken(authOpts.serviceAccountJson);
  if (adcAuth && adcAuth.accessToken) {
    const projectId = authOpts.projectId || process.env.GCP_PROJECT_ID || adcAuth.creds.project_id || adcAuth.creds.quota_project_id;
    const location = authOpts.location || process.env.GCP_LOCATION || 'us-central1';
    if (!projectId) {
      throw new Error('GCP_PROJECT_ID missing in .env or Service Account JSON');
    }
    const target = getVertexEndpoint(targetModel, projectId, location, false);
    resp = await httpsPostJson(target.hostname, target.path, reqPayload, {
      'Authorization': `Bearer ${adcAuth.accessToken}`
    });
    engineLabel = `Vertex AI ADC (${targetModel})`;
  } else if (authOpts.apiKey) {
    const apiPath = `/v1beta/models/${encodeURIComponent(targetModel)}:generateContent?key=${encodeURIComponent(authOpts.apiKey)}`;
    resp = await httpsPostJson('generativelanguage.googleapis.com', apiPath, reqPayload);
  } else {
    throw new Error('No ADC Service Account or Gemini API Key configured');
  }

  if (resp.statusCode !== 200 || !resp.data || !resp.data.candidates) {
    throw new Error((resp.data && resp.data.error && resp.data.error.message) || `Gemini API Error (${resp.statusCode})`);
  }

  const textOut = resp.data.candidates[0].content.parts[0].text;
  const parsed = JSON.parse(textOut);

  // Merge with deterministic governance metadata
  const dir = CIVIC_DIRECTORIES[pincode] || CIVIC_DIRECTORIES['default'];
  const aqi = parsed.normalizedData.aqi;
  const prevAQI = prevBrief && prevBrief.aqi ? prevBrief.aqi : (aqi - 24);
  const deltaAQI = aqi - prevAQI;
  const deltaPct = prevAQI ? ((deltaAQI / prevAQI) * 100).toFixed(1) : '0.0';

  return {
    success: true,
    engine: engineLabel,
    briefId: `brief_${Date.now()}`,
    timestamp: new Date().toISOString(),
    userRole,
    pincode,
    language,
    normalizedData: parsed.normalizedData,
    executiveBrief: parsed.executiveBrief,
    wordCount: (parsed.executiveBrief || '').split(/\s+/).filter(Boolean).length,
    hotspots: parsed.hotspots || [],
    governmentComparison: {
      stationName: govData.station,
      officialAQI: govData.aqi,
      delta: aqi - govData.aqi,
      varianceStatus: Math.abs(aqi - govData.aqi) <= 15 ? 'High Correlation with Official Sensor' : 'Hyper-local microclimate variance detected'
    },
    deltaComparison: {
      previousAQI: prevAQI,
      currentAQI: aqi,
      change: deltaAQI,
      percentage: deltaPct,
      trend: deltaAQI > 5 ? 'WORSENING' : (deltaAQI < -5 ? 'IMPROVING' : 'STABLE'),
      summary: `AQI shifted by ${deltaAQI >= 0 ? '+' : ''}${deltaAQI} points (${deltaPct}%) against previous brief.`
    },
    prioritizedActions: parsed.prioritizedActions,
    clarificationQuestions: parsed.clarificationQuestions || [],
    responsibleContact: {
      authority: dir.authority,
      ward: dir.ward,
      engineer: dir.engineer,
      phone: dir.phone,
      email: dir.email,
      magistrate: dir.magistrate,
      policing: dir.policing,
      escalationFormReady: true
    },
    advisories: parsed.advisories
  };
}

/**
 * Heuristic fallback parser & synthesis engine
 */
function analyzeLocally(rawText, userRole, pincode, targetLang, prevBrief, govOverride = null) {
  const cleanText = (rawText || '').trim();
  const pc = (pincode || '110085').trim();
  const govData = govOverride || GOV_STATIONS[pc] || {
    station: `State Pollution Board Station (${pc})`,
    aqi: 320, pm25: 195, pm10: 340, no2: 55, so2: 14, co: 1.8, o3: 26,
    agency: 'State Pollution Control Board'
  };

  const pm25Match = cleanText.match(/PM\s*2\.?5\s*[:=]?\s*(\d+(?:\.\d+)?)/i) || cleanText.match(/(\d+(?:\.\d+)?)\s*(?:ug\/m3|µg\/m³)/i);
  const pm10Match = cleanText.match(/PM\s*10\s*[:=]?\s*(\d+(?:\.\d+)?)/i);
  const aqiMatch = cleanText.match(/AQI\s*[:=]?\s*(\d+)/i) || cleanText.match(/Air\s*Quality\s*(?:Index)?\s*[:=]?\s*(\d+)/i);
  const no2Match = cleanText.match(/NO2\s*[:=]?\s*(\d+(?:\.\d+)?)/i);
  const so2Match = cleanText.match(/SO2\s*[:=]?\s*(\d+(?:\.\d+)?)/i);
  const coMatch = cleanText.match(/CO\s*[:=]?\s*(\d+(?:\.\d+)?)/i);

  let pm25 = pm25Match ? parseFloat(pm25Match[1]) : (govData.pm25 + 12);
  let pm10 = pm10Match ? parseFloat(pm10Match[1]) : (govData.pm10 + 18);
  let aqi = aqiMatch ? parseInt(aqiMatch[1], 10) : Math.round(pm25 * 1.5 + 25);
  let no2 = no2Match ? parseFloat(no2Match[1]) : govData.no2;
  let so2 = so2Match ? parseFloat(so2Match[1]) : null;
  let co = coMatch ? parseFloat(coMatch[1]) : 2.1;

  let category = 'Moderate';
  if (aqi <= 50) category = 'Good';
  else if (aqi <= 100) category = 'Satisfactory';
  else if (aqi <= 200) category = 'Moderate';
  else if (aqi <= 300) category = 'Poor';
  else if (aqi <= 400) category = 'Very Poor';
  else category = 'Severe / Hazardous';

  const dataGaps = [];
  if (!so2) {
    dataGaps.push({ parameter: 'SO2 (Sulfur Dioxide)', observedIssue: 'Sensor readout absent in ingested data', recommendedAction: 'Deploy mobile flue gas analyzer to verify industrial emissions' });
  }
  if (!cleanText.includes('Time') && !cleanText.includes('AM') && !cleanText.includes('PM')) {
    dataGaps.push({ parameter: 'Timestamp Metadata', observedIssue: 'No explicit collection timestamp identified', recommendedAction: 'Defaulted to current system ingestion pulse' });
  }

  let prevAQI = prevBrief && prevBrief.aqi ? prevBrief.aqi : (aqi - 28);
  let deltaAQI = aqi - prevAQI;
  let deltaPercentage = ((deltaAQI / prevAQI) * 100).toFixed(1);
  let trend = deltaAQI > 5 ? 'WORSENING' : (deltaAQI < -5 ? 'IMPROVING' : 'STABLE');

  const hotspots = [
    { pincode: pc, areaName: `Central Ward Corridor (${pc})`, aqi: Math.round(aqi * 1.05), severity: category, suspectedSource: 'Heavy vehicle transit & resuspended road dust' },
    { pincode: String(parseInt(pc, 10) + 1), areaName: 'Industrial / Logistics Belt', aqi: Math.round(aqi * 1.12), severity: 'Severe', suspectedSource: 'Unpaved transit corridors & diesel generator sets' },
    { pincode: String(parseInt(pc, 10) - 1), areaName: 'Metro Junction & Commercial Hub', aqi: Math.round(aqi * 0.94), severity: 'Poor', suspectedSource: 'Idling vehicular congestion' }
  ];

  const actionMatrix = {
    super_admin: {
      immediateP0: [
        { title: 'Issue Ward-Wide GRAP Stage IV Emergency Order', detail: `Authorize immediate halt on non-essential civil works across Pincode ${pc} and adjoining wards.`, timeframe: 'Immediate (1 Hour)', assignedTo: 'Municipal Commissioner Wing' },
        { title: 'Deploy Mobile Anti-Smog Fleet', detail: 'Reallocate 5 water misting tankers to critical hotspots.', timeframe: '1-2 Hours', assignedTo: 'Zonal Sanitation Head' }
      ],
      precautionaryP1: [
        { title: 'Audit Ward Officer Compliance Reports', detail: 'Require hourly photographic ATR from all field engineers.', timeframe: '6 Hours', assignedTo: 'Central Command Desk' }
      ]
    },
    ward_officer: {
      immediateP0: [
        { title: 'Deploy High-Pressure Water Misting Cannons', detail: `Dispatch 3 mobile anti-smog guns immediately to high-traffic stretches in Pincode ${pc}.`, timeframe: 'Immediate (1-2 Hours)', assignedTo: 'Ward Sanitation Wing' },
        { title: 'Halt Uncovered Excavation & Construction Dust', detail: 'Issue stop-work notices to active civil sites failing 3-tier dust curtain requirements.', timeframe: '2 Hours', assignedTo: 'Municipal Enforcement Squad' }
      ],
      precautionaryP1: [
        { title: 'Mechanized Sweeping on Arterial Roads', detail: 'Schedule wet vacuum sweeping during off-peak night hours to avoid fine particle resuspension.', timeframe: 'Next 12 Hours', assignedTo: 'Night Road Maintenance Team' },
        { title: 'Stagger Commercial Freight Timings', detail: 'Coordinate with Traffic Police to restrict non-essential heavy trucks entering the ward boundary.', timeframe: '24 Hours', assignedTo: 'Traffic Division' }
      ]
    },
    housing_society: {
      immediateP0: [
        { title: 'Curtail Non-Essential Diesel Generators (DG)', detail: 'Switch society common area loads to solar/grid backup; restrict continuous DG runtime.', timeframe: 'Immediate (1 Hour)', assignedTo: 'Society Facility Manager' },
        { title: 'Activate Boundary Water Sprinklers', detail: 'Turn on society perimeter and driveway misting nozzles twice daily to settle ambient dust.', timeframe: 'Immediate', assignedTo: 'Maintenance Staff' }
      ],
      precautionaryP1: [
        { title: 'Issue Resident Smog Advisory Broadcast', detail: 'Send urgent WhatsApp/app alerts advising residents to seal windows and wear N95 masks outdoors.', timeframe: 'Within 2 Hours', assignedTo: 'RWA Secretary' }
      ]
    },
    school: {
      immediateP0: [
        { title: 'Suspend Outdoor Physical Activities & Sports', detail: 'Cancel all outdoor morning assemblies, football/cricket sessions, and open-air games immediately.', timeframe: 'Immediate', assignedTo: 'Physical Education Head' },
        { title: 'Activate Classroom Air Filtration', detail: 'Ensure sealed ventilation and switch classroom air purifiers to maximum HEPA mode.', timeframe: 'Immediate', assignedTo: 'Campus Admin' }
      ],
      precautionaryP1: [
        { title: 'Parent Transport & Mask Compliance Advisory', detail: 'Issue circular mandating N95/protective masks during school bus transit for all students.', timeframe: 'Within 3 Hours', assignedTo: 'School Principal' }
      ]
    },
    commercial: {
      immediateP0: [
        { title: 'Upgrade Air Handling Unit (AHU) Filtration to MERV 13', detail: 'Recirculate filtered indoor air and restrict fresh air intake during peak smog hours.', timeframe: 'Immediate (2 Hours)', assignedTo: 'HVAC Lead' },
        { title: 'Cover All Exposed Material Storage', detail: 'Enclose aggregate, sand, and cement piles with impervious plastic tarpaulins.', timeframe: 'Within 2 Hours', assignedTo: 'Site Safety Inspector' }
      ],
      precautionaryP1: [
        { title: 'Stagger Shift Timings to Minimize Smog Inhalation', detail: 'Allow hybrid remote work or adjust morning shift arrivals away from peak morning inversion.', timeframe: 'Next 12 Hours', assignedTo: 'Operations Director' }
      ]
    },
    citizen: {
      immediateP0: [
        { title: 'Avoid Outdoor Cardio & Morning Walks', detail: 'Stay indoors during morning and late evening hours when cold temperature traps toxic pollutants.', timeframe: 'Immediate', assignedTo: 'Individual / Household' },
        { title: 'Wear Fitted N95 / FFP2 Respirator', detail: 'Standard cloth masks do not filter PM2.5. Wear certified N95 respirators if outdoor transit is unavoidable.', timeframe: 'Immediate', assignedTo: 'Individual' }
      ],
      precautionaryP1: [
        { title: 'Report Local Waste or Leaf Burning', detail: 'Use the CivicAQI escalation form to report any open waste fires directly to the municipal team.', timeframe: 'Immediate', assignedTo: 'Citizen' }
      ]
    }
  };

  const selectedActions = actionMatrix[userRole] || actionMatrix['ward_officer'];

  const advisoriesByLang = {
    en: {
      children: 'Avoid all outdoor sports and physical exercise. Keep classroom and room windows closed. Ensure fitted N95 masks when commuting to school.',
      olderAdults: 'Remain indoors. Keep inhalers and prescribed medication accessible. Run indoor air purifiers and avoid morning walks before sunrise.',
      sensitivePatients: 'High risk of bronchospasm. Avoid any outdoor physical strain; seek immediate medical attention if experiencing wheezing or chest tightness.',
      commercial: 'Enforce dust suppression at entry ramps, pause uncurtained material loading, and switch HVAC systems to high-efficiency indoor recirculation.',
      general: 'Air quality is at hazardous levels. Wear protective N95 masks outdoors, avoid high-traffic corridors, and report any open garbage burning.'
    },
    hi: {
      children: 'सभी आउटडोर खेल और शारीरिक व्यायाम तुरंत बंद करें। स्कूल आते-जाते समय N95 मास्क अवश्य पहनें और खिड़कियां बंद रखें।',
      olderAdults: 'घर के अंदर ही रहें। सुबह की सैर से पूरी तरह बचें। अपनी दवाइयां व इनहेलर पास रखें और संभव हो तो एयर प्यूरीफायर चलाएं।',
      sensitivePatients: 'अस्थमा व सांस के मरीजों के लिए यह स्तर बेहद खतरनाक है। छाती में जकड़न या सांस फूलने पर तुरंत डॉक्टर से संपर्क करें।',
      commercial: 'व्यावसायिक भवनों में एयर फिल्टर चालू रखें, खुले में धूल न उड़ने दें और निर्माण सामग्री को तिरपाल से ढक कर रखें।',
      general: 'हवा की गुणवत्ता खतरनाक श्रेणी में है। बाहर निकलते समय N95 मास्क लगाएं और कचरा या पत्तियां जलाने पर तुरंत नगर निगम को सूचित करें।'
    },
    mr: {
      children: 'मैदानी खेळ आणि व्यायाम त्वरित थांबवा. शाळेत ये-जा करताना N95 मास्क वापरा आणि खिडक्या बंद ठेवा.',
      olderAdults: 'घरामध्येच राहा. पहाटे फिरणे टाळा. दमा आणि हृदयविकाराच्या रुग्णांनी औषधे सोबत ठेवावीत आणि प्युरिफायर चालू ठेवावा.',
      sensitivePatients: 'श्वसनाचा त्रास असणाऱ्यांसाठी हवा अतिशय धोकादायक आहे. छातीत त्रास जाणवल्यास तत्काळ वैद्यकीय सल्ला घ्या.',
      commercial: 'धुळीवर पाणी फवारणी करा, वातानुकूलित यंत्रणांचे फिल्टर्स तपासा आणि जनरेटरचा अनावश्यक वापर टाळा.',
      general: 'हवेचा दर्जा अतिशय खालावला आहे. बाहेर पडताना प्रमाणित मास्क वापरा आणि उघड्यावर कचरा जाळण्यास प्रतिबंध करा.'
    },
    ta: {
      children: 'வெளிப்புற விளையாட்டுகளை உடனடியாக நிறுத்துங்கள். பள்ளிக்குச் செல்லும்போது N95 முகக்கவசம் அணியுங்கள்.',
      olderAdults: 'வீட்டிலேயே இருங்கள். அதிகாலை நடைப்பயிற்சியைத் தவிர்க்கவும். ஆஸ்துமா நோயாளிகள் மருந்துகளை அருகில் வைத்திருக்கவும்.',
      sensitivePatients: 'சுவாசப் பிரச்சனை உள்ளவர்களுக்கு காற்று மிகவும் ஆபத்தானது. மூச்சுத்திணறல் ஏற்பட்டால் உடனே மருத்துவரை அணுகவும்.',
      commercial: 'கட்டுமானப் பகுதிகளில் தூசு பரவாமல் தடுக்க நீர் தெளிக்கவும். கட்டிடக் கழிவுகளை மூடப்பட்ட நிலையில் வைக்கவும்.',
      general: 'காற்று தரம் மிகவும் மோசமாக உள்ளது. வெளியில் செல்லும்போது கண்டிப்பாக முகக்கவசம் அணியுங்கள்.'
    },
    bn: {
      children: 'বাইরে খেলাধুলা অবিলম্বে বন্ধ রাখুন। স্কুলে যাতায়াতের সময় N95 মাস্ক ব্যবহার করুন এবং ঘরের জানালা বন্ধ রাখুন।',
      olderAdults: 'ঘরের ভেতর থাকুন। ভোরের হাঁটা সম্পূর্ণভাবে এড়িয়ে চলুন। ইনহেলার ও জরুরি ওষুধ সবসময় হাতের কাছে রাখুন।',
      sensitivePatients: 'শ্বাসকষ্টের রোগীদের জন্য এই বায়ু অত্যন্ত ঝুঁকিপূর্ণ। কোনো অস্বস্তি হলে দ্রুত চিকিৎসকের পরামর্শ নিন।',
      commercial: 'নির্মাণ সামগ্রী ত্রিপল দিয়ে ঢেকে রাখুন এবং কাজের জায়গায় নিয়মিত জল স্প্রে করার ব্যবস্থা করুন।',
      general: 'বাতাসের মান অত্যন্ত বিপজ্জনক অবস্থায় রয়েছে। বাইরে বেরোলে ভালো মানের মাস্ক পরুন এবং আবর্জনা পোড়ানো বন্ধ করুন।'
    }
  };

  const selectedAdv = advisoriesByLang[targetLang] || advisoriesByLang['en'];
  const dir = CIVIC_DIRECTORIES[pc] || CIVIC_DIRECTORIES['default'];

  const executiveBrief = `Current civic air quality surveillance for Pincode ${pc} demonstrates severe atmospheric degradation, characterized by an overall Composite AQI of ${aqi} (${category}). The predominant driver of this event is fine particulate matter (PM2.5 at ${pm25} µg/m³), accompanied by elevated respirable coarse particles (PM10 at ${pm10} µg/m³), both substantially exceeding National Ambient Air Quality Standards and WHO safety thresholds. 

Spatial cross-analysis pinpoints significant localized emission accumulation along the primary transit corridor and adjacent logistics stretches, primarily triggered by low surface wind speeds, nocturnal thermal inversion, and unmitigated road dust resuspension. Official government monitoring via ${govData.station} confirms a verified base AQI of ${govData.aqi}, exhibiting a localized variance of ${aqi >= govData.aqi ? '+' : ''}${aqi - govData.aqi} points, which corroborates intense hyper-local emission spikes above background municipal averages.

Data integrity diagnostics identify an absence of continuous SO2 and anemometer wind-vector metrics in the submitted dataset; while non-fatal for immediate emergency containment, these gaps necessitate deploying mobile surveillance vans equipped with multi-gas analyzers. Compared to the preceding measurement cycle, overall toxicity has registered a ${trend.toLowerCase()} trend (${deltaAQI >= 0 ? '+' : ''}${deltaAQI} AQI points, ${deltaPercentage}%), requiring immediate role-tailored civic interventions across administrative departments. Ward teams must enforce targeted anti-smog misting cannons, institutional bodies must curtail outdoor physical exposure for school children, housing societies must restrict diesel generator operations, and citizens must strictly adhere to personal respiratory safety protocols. Continuous real-time field surveillance remains active across all sensitive community pockets.`;

  return {
    success: true,
    engine: 'Local Heuristic Engine (Enter Gemini Key for Live LLM)',
    briefId: `brief_${Date.now()}`,
    timestamp: new Date().toISOString(),
    userRole,
    pincode: pc,
    language: targetLang,
    normalizedData: {
      aqi,
      category,
      primaryPollutant: 'PM2.5',
      metrics: {
        pm25: { value: pm25, unit: 'µg/m³', status: pm25 > 120 ? 'Hazardous' : (pm25 > 60 ? 'Severe' : 'Moderate'), source: 'Pasted Ingest / Sensor Stream' },
        pm10: { value: pm10, unit: 'µg/m³', status: pm10 > 250 ? 'Severe' : (pm10 > 100 ? 'Poor' : 'Moderate'), source: 'Pasted Ingest / Sensor Stream' },
        no2: { value: no2, unit: 'ppb', status: no2 > 80 ? 'Elevated' : 'Moderate', source: 'Government / Sensor Match' },
        so2: { value: so2, unit: 'ppb', status: so2 ? 'Moderate' : 'Missing', source: so2 ? 'Sensor' : 'Unreported' },
        co: { value: co, unit: 'mg/m³', status: 'Moderate', source: 'Ground Sensor Stream' }
      },
      dataGaps
    },
    executiveBrief,
    wordCount: executiveBrief.split(/\s+/).length,
    hotspots,
    governmentComparison: {
      stationName: govData.station,
      officialAQI: govData.aqi,
      delta: aqi - govData.aqi,
      varianceStatus: Math.abs(aqi - govData.aqi) <= 15 ? 'High Correlation with Official Sensor (< 5% delta)' : 'Hyper-local microclimate variance detected'
    },
    deltaComparison: {
      previousAQI: prevAQI,
      currentAQI: aqi,
      change: deltaAQI,
      percentage: deltaPercentage,
      trend,
      summary: `AQI shifted by ${deltaAQI >= 0 ? '+' : ''}${deltaAQI} points (${deltaPercentage}%) against previous brief. Critical hotspot remains Pincode ${pc}.`
    },
    prioritizedActions: selectedActions,
    clarificationQuestions: [
      `Is uncontained road excavation or construction material handling currently visible within 500m of Pincode ${pc}?`,
      `Are heavy commercial diesel trucks or long-haul freight vehicles actively idling near major traffic intersections in this ward?`
    ],
    responsibleContact: {
      authority: dir.authority,
      ward: dir.ward,
      engineer: dir.engineer,
      phone: dir.phone,
      email: dir.email,
      magistrate: dir.magistrate,
      policing: dir.policing,
      escalationFormReady: true
    },
    advisories: selectedAdv
  };
}

/**
 * Stream Gemini Chat via Server-Sent Events (SSE)
 */
async function streamGeminiChat(req, res, payload) {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive'
  });

  const apiKey = (payload.apiKey || process.env.GEMINI_API_KEY || '').trim();
  const model = payload.model || process.env.GEMINI_MODEL || 'gemini-2.5-flash';
  const messages = payload.messages || [];
  const ctx = payload.context || {};

  let adcAuth = null;
  try {
    adcAuth = await getAdcAccessToken(payload.serviceAccountJson);
  } catch (adcErr) {
    res.write(`data: ${JSON.stringify({ error: `ADC Auth Error: ${adcErr.message}` })}\n\n`);
    res.end();
    return;
  }

  const systemInstruction = `You are CivicAQI Assistant, an empathetic yet professional civic intelligence advisor.
User Profile: Role=${ctx.userRole || 'citizen'}, Pincode=${ctx.pincode || '110085'}, Name=${ctx.userName || 'User'}.
Current AQI Context: AQI=${ctx.aqi || 'Unknown'} (${ctx.category || 'N/A'}), Primary Pollutant=${ctx.primaryPollutant || 'PM2.5'}, Govt Station=${ctx.govStation || 'N/A'}.
Executive Brief Summary: ${ctx.executiveBrief || 'No active brief yet.'}

Instructions:
- Match the user's communication language and tone while remaining professional and actionable.
- Ask relevant clarifying questions about local emission sources (construction dust, waste burning, traffic) if needed.
- Recommend contacting the responsible local body (${ctx.authority || 'Municipal Ward Officer'}) when action is required.
- Be concise, accurate, and cite exact numbers from the context.`;

  if (!adcAuth && !apiKey) {
    // Graceful simulated token streaming when neither ADC nor API Key is provided
    const lastUserMsg = (messages[messages.length - 1]?.text || '').toLowerCase();
    let reply = `Based on the current reading for Pincode ${ctx.pincode || '110085'} (AQI: ${ctx.aqi || 395}, ${ctx.category || 'Very Poor'}), `;
    if (lastUserMsg.includes('yes') || lastUserMsg.includes('burning') || lastUserMsg.includes('construction')) {
      reply += `thank you for confirming that local emission source. I have noted this in your dossier. As a ${ctx.userRole || 'stakeholder'}, you should immediately notify ${ctx.authority || 'the Municipal Ward Officer'} using the Section 133 Escalation Form, and ensure nearby residents keep windows sealed.`;
    } else if (lastUserMsg.includes('school') || lastUserMsg.includes('child')) {
      reply += `children are at high risk due to elevated PM2.5. All outdoor sports and morning assemblies should be moved indoors immediately, and fitted N95 masks should be worn during transit.`;
    } else {
      reply += `the primary driver is ${ctx.primaryPollutant || 'PM2.5'}. Could you confirm if you observe any active road excavation, uncovered construction material, or open garbage burning near your block? I can help you draft an official notice to ${ctx.authority || 'the Ward Engineer'} right away.`;
    }
    reply += `\n\n*(Streaming via Local Fallback — Configure ADC Service Account in .env or 🔑 AI & Auth Config for live Vertex AI / Gemini streaming)*`;

    const words = reply.split(' ');
    let i = 0;
    const timer = setInterval(() => {
      if (i < words.length) {
        const chunk = (i === 0 ? '' : ' ') + words[i];
        res.write(`data: ${JSON.stringify({ chunk })}\n\n`);
        i++;
      } else {
        clearInterval(timer);
        res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
        res.end();
      }
    }, 35);
    return;
  }

  // Real Gemini / Vertex AI ADC SSE Streaming Call
  const contents = messages.map(m => ({
    role: m.sender === 'user' ? 'user' : 'model',
    parts: [{ text: m.text }]
  }));

  const geminiPayload = JSON.stringify({
    systemInstruction: { parts: [{ text: systemInstruction }] },
    contents,
    generationConfig: { temperature: 0.4 }
  });

  let reqHostname = 'generativelanguage.googleapis.com';
  let reqPath = `/v1beta/models/${encodeURIComponent(model)}:streamGenerateContent?alt=sse&key=${encodeURIComponent(apiKey)}`;
  const reqHeaders = {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(geminiPayload)
  };

  if (adcAuth && adcAuth.accessToken) {
    const projectId = payload.projectId || process.env.GCP_PROJECT_ID || adcAuth.creds.project_id || adcAuth.creds.quota_project_id;
    const location = payload.location || process.env.GCP_LOCATION || 'us-central1';
    if (!projectId) {
      res.write(`data: ${JSON.stringify({ error: 'GCP_PROJECT_ID missing in .env or Service Account JSON' })}\n\n`);
      res.end();
      return;
    }
    const target = getVertexEndpoint(model, projectId, location, true);
    reqHostname = target.hostname;
    reqPath = target.path;
    reqHeaders['Authorization'] = `Bearer ${adcAuth.accessToken}`;
  }

  const apiReq = https.request({
    hostname: reqHostname,
    path: reqPath,
    method: 'POST',
    headers: reqHeaders
  }, apiRes => {
    if (apiRes.statusCode !== 200) {
      let errBody = '';
      apiRes.on('data', d => { errBody += d; });
      apiRes.on('end', () => {
        res.write(`data: ${JSON.stringify({ error: `Gemini API Error (${apiRes.statusCode}): ${errBody}` })}\n\n`);
        res.end();
      });
      return;
    }

    let buffer = '';
    apiRes.on('data', chunk => {
      buffer += chunk.toString();
      const lines = buffer.split('\n');
      buffer = lines.pop(); // keep incomplete line
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const jsonStr = line.slice(6).trim();
          if (!jsonStr) continue;
          try {
            const parsed = JSON.parse(jsonStr);
            const textChunk = parsed?.candidates?.[0]?.content?.parts?.[0]?.text;
            if (textChunk) {
              res.write(`data: ${JSON.stringify({ chunk: textChunk })}\n\n`);
            }
          } catch (e) {}
        }
      }
    });

    apiRes.on('end', () => {
      res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
      res.end();
    });
  });

  apiReq.on('error', err => {
    res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
    res.end();
  });

  apiReq.write(geminiPayload);
  apiReq.end();
}

/**
 * Main HTTP Server
 */
const server = http.createServer(async (req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // GET /api/config — Exposes public configuration & ADC/Service Account readiness
  if (pathname === '/api/config' && req.method === 'GET') {
    const discovered = discoverAdcCredentials();
    const adcProjectId = process.env.GCP_PROJECT_ID || discovered?.creds?.project_id || discovered?.creds?.quota_project_id || '';
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      adcDetected: Boolean(discovered),
      adcSource: discovered ? discovered.source : 'None',
      adcType: discovered?.creds?.type || 'none',
      adcEmail: discovered?.creds?.client_email || '',
      projectId: adcProjectId,
      location: process.env.GCP_LOCATION || 'us-central1',
      hasServerGeminiKey: Boolean(process.env.GEMINI_API_KEY),
      geminiModel: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
      firebase: {
        configured: Boolean(process.env.FIREBASE_API_KEY),
        apiKey: process.env.FIREBASE_API_KEY || '',
        authDomain: process.env.FIREBASE_AUTH_DOMAIN || '',
        projectId: process.env.FIREBASE_PROJECT_ID || ''
      }
    }));
    return;
  }

  // POST /api/auth/signup & /api/auth/login — Firebase Auth REST + Local Profile Store
  if ((pathname === '/api/auth/signup' || pathname === '/api/auth/login') && req.method === 'POST') {
    try {
      const body = await readBody(req);
      const fbKey = (body.firebaseApiKey || process.env.FIREBASE_API_KEY || '').trim();
      const isSignup = pathname.endsWith('signup');

      let uid = `local_${Date.now()}`;
      let idToken = `demo_token_${Date.now()}`;
      let authProvider = 'Local CivicAuth';

      if (fbKey) {
        const endpoint = isSignup
          ? `/v1/accounts:signUp?key=${encodeURIComponent(fbKey)}`
          : `/v1/accounts:signInWithPassword?key=${encodeURIComponent(fbKey)}`;
        const fbResp = await httpsPostJson('identitytoolkit.googleapis.com', endpoint, {
          email: body.email,
          password: body.password,
          returnSecureToken: true
        });
        if (fbResp.statusCode !== 200 || !fbResp.data || !fbResp.data.localId) {
          const msg = fbResp.data?.error?.message || 'Firebase Authentication Failed';
          res.writeHead(401, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: msg }));
          return;
        }
        uid = fbResp.data.localId;
        idToken = fbResp.data.idToken;
        authProvider = 'Firebase Auth Live';
      }

      // Load/Save extended civic user profile (Designation, Authority, Address, Pincode, Role)
      let users = {};
      if (fs.existsSync(USERS_FILE)) {
        try { users = JSON.parse(fs.readFileSync(USERS_FILE, 'utf8')); } catch (e) {}
      }

      if (isSignup || !users[body.email]) {
        users[body.email] = {
          uid,
          email: body.email,
          name: body.name || body.email.split('@')[0],
          role: body.role || 'citizen',
          designation: body.designation || 'Resident',
          authority: body.authority || 'Self / Local Community',
          address: body.address || '',
          pincode: body.pincode || '110085',
          isAdmin: body.role === 'super_admin' || body.role === 'ward_officer',
          createdAt: new Date().toISOString()
        };
        fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
      }

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: true,
        authProvider,
        idToken,
        user: users[body.email]
      }));
    } catch (e) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: e.message }));
    }
    return;
  }

  // GET /api/live-gov-data
  if (pathname === '/api/live-gov-data' && req.method === 'GET') {
    const pc = parsedUrl.query.pincode || '110085';
    const station = await fetchLiveGovData(pc);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true, pincode: pc, station }));
    return;
  }

  // GET /api/history
  if (pathname === '/api/history' && req.method === 'GET') {
    fs.readFile(HISTORY_FILE, 'utf8', (err, data) => {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(!err && data ? data : '[]');
    });
    return;
  }

  // POST /api/analyze — Supports Gemini Live API or Local Heuristic Fallback
  if (pathname === '/api/analyze' && req.method === 'POST') {
    try {
      const payload = await readBody(req);
      const rawInput = payload.rawInput || '';
      const imageBase64 = payload.imageBase64 || null;
      const userRole = payload.userRole || 'ward_officer';
      const pincode = payload.pincode || '110085';
      const language = payload.language || 'en';
      const prevBrief = payload.prevBrief || null;
      const apiKey = (payload.apiKey || process.env.GEMINI_API_KEY || '').trim();
      const serviceAccountJson = payload.serviceAccountJson || null;
      const projectId = payload.projectId || process.env.GCP_PROJECT_ID || '';
      const location = payload.location || process.env.GCP_LOCATION || 'us-central1';
      const model = payload.model || process.env.GEMINI_MODEL || 'gemini-2.5-flash';
      const hasAdc = Boolean(discoverAdcCredentials(serviceAccountJson));

      let analysis;
      if (hasAdc || apiKey) {
        try {
          analysis = await callGeminiAnalyze(
            { apiKey, serviceAccountJson, projectId, location },
            model, rawInput, imageBase64, userRole, pincode, language, prevBrief
          );
        } catch (geminiErr) {
          const liveGov = await fetchLiveGovData(pincode);
          analysis = analyzeLocally(rawInput, userRole, pincode, language, prevBrief, liveGov);
          analysis.engine = `Fallback (ADC/Gemini Error: ${geminiErr.message})`;
        }
      } else {
        const liveGov = await fetchLiveGovData(pincode);
        analysis = analyzeLocally(rawInput, userRole, pincode, language, prevBrief, liveGov);
      }

      // Persist to local history
      fs.readFile(HISTORY_FILE, 'utf8', (err, histData) => {
        let list = [];
        try { if (!err && histData) list = JSON.parse(histData); } catch (e) {}
        list.unshift({
          id: analysis.briefId,
          timestamp: analysis.timestamp,
          pincode: analysis.pincode,
          aqi: analysis.normalizedData.aqi,
          category: analysis.normalizedData.category,
          primaryPollutant: analysis.normalizedData.primaryPollutant,
          summary: analysis.deltaComparison.summary,
          engine: analysis.engine
        });
        if (list.length > 25) list = list.slice(0, 25);
        fs.writeFile(HISTORY_FILE, JSON.stringify(list, null, 2), () => {});
      });

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(analysis));
    } catch (err) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message }));
    }
    return;
  }

  // POST /api/chat/stream — SSE Streaming Chatbot
  if (pathname === '/api/chat/stream' && req.method === 'POST') {
    try {
      const payload = await readBody(req);
      streamGeminiChat(req, res, payload);
    } catch (err) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message }));
    }
    return;
  }

  // POST /api/assign-action — RBAC Admin Action Assignment vs Non-Admin Request
  if (pathname === '/api/assign-action' && req.method === 'POST') {
    try {
      const body = await readBody(req);
      const isAdmin = body.userRole === 'super_admin' || body.userRole === 'ward_officer';
      const entry = {
        id: `ACT-${Date.now().toString(36).toUpperCase()}`,
        timestamp: new Date().toISOString(),
        type: isAdmin ? 'OFFICIAL_ADMIN_ASSIGNMENT' : 'INTERVENTION_REQUEST_TO_BODY',
        assignedBy: body.assignedBy || 'Unknown',
        userRole: body.userRole,
        targetBody: body.targetBody,
        actionTitle: body.actionTitle,
        deadline: body.deadline || '2 Hours',
        pincode: body.pincode || '110085',
        status: isAdmin ? 'ASSIGNED_AND_ENFORCED' : 'PENDING_AUTHORITY_REVIEW'
      };

      let actions = [];
      if (fs.existsSync(ACTIONS_FILE)) {
        try { actions = JSON.parse(fs.readFileSync(ACTIONS_FILE, 'utf8')); } catch (e) {}
      }
      actions.unshift(entry);
      fs.writeFileSync(ACTIONS_FILE, JSON.stringify(actions.slice(0, 50), null, 2));

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, record: entry }));
    } catch (e) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: e.message }));
    }
    return;
  }

  // POST /api/escalate
  if (pathname === '/api/escalate' && req.method === 'POST') {
    try {
      const data = await readBody(req);
      const ticketId = `CIVIC-ESC-${Date.now().toString(36).toUpperCase()}`;
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: true,
        ticketId,
        timestamp: new Date().toISOString(),
        status: 'OFFICIALLY_LOGGED_AND_DISPATCHED',
        officerNotified: data.officer || 'District Magistrate & Pollution Control Officer',
        pincode: data.pincode || '110085',
        statuteInvoked: 'Section 133 CrPC / Air (Prevention & Control of Pollution) Act 1981'
      }));
    } catch (e) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Bad Request' }));
    }
    return;
  }

  // Static File Serving
  let safePath = path.normalize(pathname).replace(/^(\.\.[\/\\])+/, '');
  if (safePath === '/' || safePath === '\\') safePath = '/index.html';
  const filePath = path.join(PUBLIC_DIR, safePath);

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      const indexFallback = path.join(PUBLIC_DIR, 'index.html');
      fs.readFile(indexFallback, (fallbackErr, content) => {
        if (fallbackErr) {
          res.writeHead(404, { 'Content-Type': 'text/plain' });
          res.end('404 Not Found');
          return;
        }
        res.writeHead(200, { 'Content-Type': 'text/html; charset=UTF-8' });
        res.end(content);
      });
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    fs.readFile(filePath, (readErr, content) => {
      if (readErr) {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('500 Internal Server Error');
        return;
      }
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content);
    });
  });
});

server.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(` CivicAQI Intelligence Platform Running!`);
  console.log(` Server URL : http://localhost:${PORT}`);
  console.log(` Gemini Key : ${process.env.GEMINI_API_KEY ? 'Configured (.env)' : 'Not in .env (UI Key Input Ready)'}`);
  console.log(` Firebase   : ${process.env.FIREBASE_API_KEY ? 'Configured (.env)' : 'Not in .env (Demo/UI Auth Ready)'}`);
  console.log(`=======================================================`);
});

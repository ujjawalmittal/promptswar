# Technical Requirements Document (TRD)
## Project Name: CivicAQI — AI-Driven Civic Intelligence Platform
**Version:** 1.0.0  
**Stack Constraints:** Pure Vanilla HTML5, CSS3, ES6+ JavaScript, Native Node.js runtime. Zero external UI frameworks or third-party CSS libraries.

---

### 1. System Architecture & Topology

```
+-----------------------------------------------------------------------------------+
|                              CLIENT TIER (Browser)                                |
|  - Vanilla HTML5 Semantic DOM + Pure CSS3 (Responsive via vw, vh, rem, clamp)      |
|  - ES6+ Modular State Store (Reactive State, LocalStorage / IndexedDB Cache)       |
|  - Native HTML5 2D Canvas & SVG Rendering Engine (Zero Chart.js/D3 dependencies)  |
|  - Firebase Auth Client (SDK + Offline Fallback State Management)                  |
+----------------------------------------^------------------------------------------+
                                         | REST / JSON / FormData
+----------------------------------------v------------------------------------------+
|                         APPLICATION SERVER (Node.js)                              |
|  - HTTP/HTTPS Server (Native 'http', 'https', 'fs', 'path', 'url')               |
|  - Static Asset Delivery (HTML, CSS, JS, Assets with strict MIME typing)           |
|  - Gemini API Gateway & Multimodal Vision Processor (gemini-2.5-flash / pro)       |
|  - Live Government AQI Aggregator & Validator (CPCB / OpenAQ / Govt Open Data)    |
|  - Local JSON Archive & Audit Trail (30-Minute Historical Cache)                  |
|  - RBAC Policy Enforcement & Request Sanitizer (XSS / Prompt Injection Guard)     |
+-----------------------------------------------------------------------------------+
```

---

### 2. Tech Stack & Engineering Standards

| Layer | Technology | Rationale & Strict Constraints |
| :--- | :--- | :--- |
| **Runtime** | Node.js (v18+) | Lightweight, asynchronous, standard built-in modules (`http`, `https`, `crypto`, `fs`). |
| **Frontend Framework** | **None (Pure Vanilla JS)** | Zero build-step requirement, instant hot loading, zero bundle overhead, maximal maintainability. |
| **Styling** | **Pure CSS3** | **NO Tailwind, Bootstrap, Sass, or preprocessors.** Responsive design powered strictly by `rem`, `vw`, `vh`, `clamp()`, CSS Grid, and Flexbox. |
| **Visualizations** | **Native HTML5 Canvas 2D & SVG** | Custom-engineered charting pipeline for line graphs, bar charts, radar charts, and hotspot heat matrices. |
| **AI / LLM Engine** | Google Gemini API (Gemini 2.5 Flash / Pro) | Native multimodal parsing for raw messy text, tables, and photos of monitoring screens. |
| **Auth & Security** | Firebase Auth + Local RBAC | Multi-provider auth with persistent user profile (Designation, Address, Pincode). |
| **Data Persistence** | Browser `localStorage` + Server JSON Store | Resilient offline-first storage, sync pulse every 30 minutes, manual force-sync. |

---

### 3. API & Service Interface Specifications

#### 3.1 Backend Endpoints (`server.js`)

##### `POST /api/analyze`
* **Purpose**: Ingests raw air quality inputs (text, pasted table, or base64 image) and runs generative normalization, verification, and role-based synthesis.
* **Request Body**:
```json
{
  "rawInput": "Ward 12, Pincode 110085. PM2.5 measured at 245 ug/m3. PM10 is 410. NO2 68. Time: 08:30 AM. Visibility is very low.",
  "image": "data:image/png;base64,...", // Optional image attachment
  "pincode": "110085",
  "userRole": "ward_officer", // "ward_officer" | "housing_society" | "school" | "commercial" | "citizen"
  "language": "hi", // Target advisory language
  "previousBriefId": "brief_1731568200" // For delta comparison
}
```
* **Response Body**:
```json
{
  "success": true,
  "briefId": "brief_1731570000",
  "timestamp": "2026-11-14T13:00:00.000Z",
  "normalizedData": {
    "aqi": 395,
    "category": "Very Poor",
    "primaryPollutant": "PM2.5",
    "metrics": {
      "pm25": { "value": 245.0, "unit": "µg/m³", "status": "Severe", "sourceRow": 1 },
      "pm10": { "value": 410.0, "unit": "µg/m³", "status": "Very Poor", "sourceRow": 1 },
      "no2": { "value": 68.0, "unit": "ppb", "status": "Moderate", "sourceRow": 1 },
      "so2": { "value": null, "unit": "ppb", "status": "Missing", "sourceRow": null },
      "co": { "value": 2.1, "unit": "mg/m³", "status": "Moderate", "sourceRow": 1 }
    },
    "dataGaps": [
      { "field": "SO2", "issue": "Missing reading in uploaded data", "severity": "Medium" },
      { "field": "WindSpeed", "issue": "Unspecified anemometer data", "severity": "Low" }
    ]
  },
  "executiveBrief": "Air quality across Pincode 110085 has deteriorated into the 'Very Poor' bracket (Composite AQI: 395) driven by extreme PM2.5 concentrations (245 µg/m³)... [200-300 words]",
  "hotspots": [
    { "pincode": "110085", "location": "Sector 9 Industrial Corridor", "aqi": 412, "severity": "Hazardous", "primarySource": "Vehicular & Resuspension" }
  ],
  "governmentComparison": {
    "stationName": "CPCB - Rohini Sector 16",
    "officialAQI": 388,
    "delta": +7,
    "varianceStatus": "Consistent with official sensor data (variance < 2%)"
  },
  "deltaComparison": {
    "previousAQI": 360,
    "currentAQI": 395,
    "change": +35,
    "trend": "WORSENING",
    "summary": "AQI has spiked by 9.7% over the last 30 minutes primarily due to morning transit emissions."
  },
  "prioritizedActions": {
    "immediate": [
      { "priority": "P0", "action": "Dispatch anti-smog water sprinklers along Main Sector 9 corridor.", "deadline": "1 Hour" }
    ],
    "precautionary": [
      { "priority": "P1", "action": "Issue stop-work advisory for uncurtained excavation sites.", "deadline": "4 Hours" }
    ]
  },
  "clarificationQuestions": [
    "Is there uncontained biomass burning or road excavation currently active near Sector 9?"
  ],
  "responsibleContact": {
    "authority": "Delhi Pollution Control Committee (DPCC) & Ward Junior Engineer",
    "phone": "+91-11-23860360",
    "email": "ward12.engineer@mcd.gov.in",
    "escalationFormReady": true
  },
  "advisories": {
    "children": "Suspend all outdoor sports, morning assemblies, and open-air activities immediately.",
    "olderAdults": "Remain indoors with closed windows. Run HEPA air purifiers if accessible.",
    "commercial": "Mandate misting cannons at loading docks; inspect diesel generator emissions.",
    "general": "Wear N95/FFP2 masks outdoors; avoid strenuous cardio."
  }
}
```

##### `GET /api/live-gov-data?pincode=110085`
* Queries live official CPCB / OpenAQ / Government public stations for the nearest monitoring coordinates and returns standard ground-truth readings.

##### `GET /api/history` & `POST /api/history`
* Synchronizes the 30-minute historical snapshot ring buffer (persisted on disk in `data/history.json`).

---

### 4. Frontend Architecture & Zero-Dependency UI System

#### 4.1 Responsive Layout Engine (`rem`, `vw`, `vh`)
* Base unit: `1rem = 16px` (scales fluidly via root typography formula: `html { font-size: clamp(14px, 1.2vw, 18px); }`).
* All spacing, paddings, margins, and card elevations use `rem` units to guarantee crisp proportional rendering on 320px mobile screens through 4K displays.
* Fluid containers utilize `min(94vw, 1400px)` for zero-overflow responsiveness.
* High-contrast civic palette:
  - Base: `#0f172a` (Slate 900 dark background) / `#f8fafc` (Canvas clean light)
  - Severity Badges: Good (`#10b981`), Moderate (`#f59e0b`), Poor (`#f97316`), Very Poor (`#ef4444`), Severe (`#7f1d1d`), Hazardous (`#4c0519`)
  - Accent Civic Blue: `#2563eb`

#### 4.2 Native Canvas 2D Charting Subsystem (`chart-engine.js`)
* Fully custom lightweight charting implementation without external libraries:
  - **Time-Series Engine**: Draws smoothed Bezier curves, dynamic Cartesian grid lines, timestamp x-axis markers, and AQI threshold color bands.
  - **Pollutant Breakdown Bar Engine**: Draws multi-metric bars with safety limit reference markers.
  - **Hotspot Spatial Map**: Interactive SVG / Canvas grid representing pincodes, colored dynamically by real-time severity levels.

---

### 5. Role-Based Access Control (RBAC) Matrix

| Capability / Action | Super Admin | Ward Officer | Housing Society | School / Inst. | Resident / Citizen |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Ingest Raw Data / Images** | Yes | Yes | Yes | Yes | Yes |
| **View Executive Brief & Charts** | Yes | Yes | Yes | Yes | Yes |
| **View Tailored Advisories** | All | Ward-level | Society-level | School-level | Citizen-level |
| **Assign Civic Interventions** | Global | Ward Staff | Internal RWA | Internal School | No |
| **Submit Official Escalation Form** | Direct Dispatch | Official File | Grievance | Grievance | Citizen Grievance |
| **Trigger Live Gov Sync** | Anytime | Anytime | Anytime | Anytime | 30-min Auto |
| **System Admin Settings** | Full Access | Read-only | Read-only | Read-only | No |

---

### 6. Data Integrity, Traceability & Security

1. **Source Traceability**: Every metric output must carry a `sourceRow` and `confidenceScore` (0.0 to 1.0).
2. **Missing Data Flagging**: If any primary pollutant ($PM_{2.5}, PM_{10}, NO_2, SO_2, CO, O_3$) is omitted, the system explicitly warns the user and marks the calculation confidence as provisional.
3. **Prompt Injection & Sanitization**: Strict input escaping and structured JSON schemas in Gemini tool calls ensure user-supplied text or pasted tables cannot alter system role behaviors.
4. **Local Fallback Mode**: If an external Gemini API key is absent, the Node.js server gracefully switches to an internal intelligent heuristic parser with complete feature parity for testing.

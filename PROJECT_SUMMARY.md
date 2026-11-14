# CivicAQI — GitHub Project Summary & Metadata
**Repository Name:** `promptswar`  
**Public URL:** `https://github.com/ujjawalmittal/promptswar`

---

## 📌 GitHub Repository Metadata (For Repo Settings)

### Short Description (About Section)
> AI-driven civic intelligence platform converting messy air quality data, tables & monitor photos into traceable, hyper-local interventions. Powered by Google Vertex AI Gemini (ADC Service Account), live CPCB/Open-Meteo cross-validation, brief-to-brief delta analysis, native HTML5 canvas charts, and zero external dependencies.

### Suggested GitHub Topics / Tags
`civic-tech`, `air-quality`, `gemini-api`, `vertex-ai`, `adc-service-account`, `prompt-engineering`, `environmental-intelligence`, `zero-dependencies`, `vanilla-js`, `firebase-auth`, `hackathon`, `promptswar`

---

## 🌟 Executive Project Overview

**CivicAQI** is a full-stack, zero-framework civic intelligence system engineered to solve the real-world operational divide in urban air quality management. While existing platforms passively report raw AQI numbers, CivicAQI turns fragmented data into **actionable, role-tailored civic interventions** suited to whoever is asking:
- A **Ward Officer** deploying anti-smog misting cannons or issuing construction stop-work notices;
- A **Housing Society (RWA)** curtailing diesel generators and broadcasting resident alerts;
- A **School Principal** suspending outdoor sports and rescheduling morning assemblies;
- A **Commercial Site Manager** upgrading HVAC filters to MERV 13 and enforcing dust tarpaulins;
- A **Citizen or Parent** seeking clear, non-technical advisories in their native regional language.

---

## 🚀 Key Technical & Functional Highlights

### 1. Multimodal & Messy Data Ingestion
* Accepts unstructured CSVs, misaligned tab-separated tables, WhatsApp forwards, citizen grievance text in any language, and mobile camera photos of physical AQI monitor display boards.
* Normalizes readings into standard SI units ($\mu g/m^3$, $ppm$, $ppb$) with full cell- and pixel-level source traceability.
* Rigorously audits data gaps (e.g., absent $SO_2$ sensors or omitted anemometer wind vectors) and calculates confidence scores without hallucinating missing values.

### 2. Live Government Ground Truth Correlation
* Queries live government monitoring feeds by Pincode / Ward (integrating CPCB, Open-Meteo Air Quality Grid, and India Post Pincode directory).
* Automatically calculates local variance ($\Delta$) against official monitoring stations to detect hyper-local micro-climate anomalies vs. sensor errors.

### 3. Brief-to-Brief Historical Delta Engine
* Automatically compares each new observation with the previous cycle:
  $$\Delta AQI = AQI_t - AQI_{t-1}$$
  $$\% \Delta = \left( \frac{\Delta AQI}{AQI_{t-1}} \right) \times 100$$
* Categorizes atmospheric shifts into clear operational directives (**CRITICAL DETERIORATION**, **MODERATE SPIKE**, **STABLE**, or **SIGNIFICANT IMPROVEMENT**).

### 4. Role-Based Action Matrix & Legal Escalation
* **P0 (Immediate Life/Health Safety - 0 to 2 hrs)** vs. **P1 (Operational Mitigation - 4 to 24 hrs)**.
* **Super Admin / Ward Officer**: Direct assignment privileges to municipal enforcement wings (`✅ Assign Action to Body`).
* **Housing Society / School / Citizen**: Submits structured intervention requests to responsible authorities (`📨 Request Intervention from Body`).
* **Section 133 Escalation Directives**: Generates formal pre-filled legal enforcement notices under **Section 133 CrPC / Air (Prevention & Control of Pollution) Act 1981**, addressed to the Sub-Divisional Magistrate (SDM) and Executive Ward Engineer.

### 5. Multi-Lingual Vulnerability Stratification
* Generates localized advisories across 5 regional languages (**English, Hindi, Marathi, Tamil, Bengali**).
* Tailors guidance across distinct reading levels and demographics:
  - **Children & Students**: Mask compliance, school bus transit protocols, outdoor playtime suspensions.
  - **Older Adults & Asthmatics**: Indoor air purification, sealed rooms, medication readiness, inversion-hour walk avoidance.
  - **Commercial Operators**: Dust suppression misting, material enclosure, shift stagger.
  - **Local Residents**: Precautionary vs. immediate emergency public safety warnings.

### 6. Interactive Streaming AI Assistant
* Real-time Server-Sent Events (**SSE**) token streaming (`POST /api/chat/stream`).
* Context-aware assistant that mirrors the user's communication language and tone, asks targeted clarifying questions, and connects directly to the AI gap verification banner.

---

## 🛠️ Zero-Dependency Architecture & Engineering Purity

| Layer | Implementation | Strict Constraint Adhered To |
| :--- | :--- | :--- |
| **Backend Runtime** | Native Node.js (v18+) | **0 npm runtime packages**; built strictly using native `http`, `https`, `crypto`, `fs`, `path`, and `os`. |
| **Frontend Framework** | Pure Vanilla HTML5 & ES6+ | **0 UI frameworks** (No React, Vue, Angular); instant load, zero build step. |
| **Styling & Layout** | Pure Custom CSS3 | **0 CSS frameworks** (No Tailwind, Bootstrap); fully responsive using `rem`, `vw`, `vh`, `clamp()`, Flexbox & Grid. |
| **Data Visualizations** | Native HTML5 Canvas 2D | **0 charting libraries** (No Chart.js, D3); custom-built Bezier curve trend visualizer & safety threshold bars. |
| **AI Authentication** | Google Cloud ADC / Service Account | Native `RS256` JWT assertion signing to Vertex AI Gemini (`gemini-2.5-flash` / `gemini-2.5-pro`). |
| **User Identity** | Firebase Auth REST | Identity Toolkit REST API integration with local profile persistence (`data/users.json`). |
| **Persistence** | LocalStorage + Server JSON | 30-minute background auto-sync pulse with manual force-refresh. |

---

## 📂 Repository File Index

```
promptswar/
├── PRD.md                            # Comprehensive Product Requirements Document
├── TRD.md                            # Technical Requirements Document & REST API Contracts
├── DESIGN.md                         # System Architecture, Responsive Layout & Delta Engine
├── PROMPTS.md                        # Master Prompt Engineering Suite (Few-shot, JSON schemas)
├── REaDme.md                         # Detailed GitHub Project Documentation
├── PROJECT_SUMMARY.md                # Quick Repository Overview & GitHub Metadata
├── CivicAQI_Executive_Summary.pdf    # Print-ready 2-page Executive PDF Summary
├── pdf_summary.html                  # Source HTML layout for the executive PDF
├── generate-pdf.js                   # Pure Node.js zero-dependency PDF generator
├── server.js                         # Native Node.js server, ADC JWT signer & SSE streaming
├── .env.example                      # Environment configuration template
├── .gitignore                        # Strict secret protection (ignores .env & service accounts)
├── data/
│   └── history.json                  # 30-minute historical snapshot cache
└── public/
    ├── index.html                    # Single Page Application UI with modals & drawers
    ├── style.css                     # Custom CSS3 fluid design system (vw, vh, rem, clamp)
    ├── app.js                        # State orchestrator, ADC config, RBAC & SSE chat
    ├── chart-engine.js               # Native HTML5 2D Canvas charting library
    └── mock-data.js                  # Realistic test scenarios (corrupt tables, Hindi reports)
```

---

## ⚡ Quick Start

```powershell
# 1. Clone repository
git clone https://github.com/ujjawalmittal/promptswar.git
cd promptswar

# 2. (Optional) Configure Google ADC Service Account or Gemini API Key
copy .env.example .env
# Fill in GOOGLE_APPLICATION_CREDENTIALS or GEMINI_API_KEY in .env
# (Or configure keys inside the web UI under 🔑 API & Auth Config)

# 3. Launch application (Zero npm install needed!)
node server.js

# 4. Open in browser
# http://localhost:3000
```

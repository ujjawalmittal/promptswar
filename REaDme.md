# CivicAQI — AI-Driven Civic Intelligence Platform
**Turning Raw, Messy Air Quality Data into Traceable, Hyper-Local Civic Interventions**

[![Platform](https://img.shields.io/badge/Platform-Node.js_Native-339933?logo=node.js)](https://nodejs.org/)
[![AI Engine](https://img.shields.io/badge/AI-Google_Vertex_AI_Gemini-4285F4?logo=google)](https://cloud.google.com/vertex-ai)
[![Auth](https://img.shields.io/badge/Auth-Google_ADC_%2F_Firebase-FFCA28?logo=firebase)](https://firebase.google.com/)
[![Dependencies](https://img.shields.io/badge/Dependencies-Zero_External_Packages-10b981)](#-zero-dependency-engineering-standards)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

---

## 1. Official Problem Statement
> *Develop an AI-driven civic intelligence solution that enables local authorities, housing societies, and ward-level teams to turn raw air quality data into actionable local interventions. The solution must leverage Generative AI as a core component to interpret pasted or uploaded data tables, including messy ones with inconsistent formats, units, or missing readings, and summarize trends and likely hotspots in plain language. It should recommend prioritized local actions suited to who is asking, since a ward officer, a housing society, and a school can each do different things. Every finding should be traceable to the underlying data, with data gaps and unreliable readings clearly flagged. The assistant should compare each new brief with the previous one to show what changed, and generate both an internal briefing note and a citizen advisory in multiple languages, written for different reading levels, with extra care for children, older adults, and people sensitive to poor air.*

---

## 2. Refined Problem Statement & Architectural Blueprint
To fulfill the official mandate and eliminate operational blindspots, the problem statement was systematically expanded to address real-world deployment challenges:
1. **Multimodal Raw Ingestion**: Ingest raw unstructured tables, mobile screenshots of digital display boards, CSV files, and multi-lingual citizen statements. Standardize them into unified SI units with complete source cell/pixel traceability.
2. **Generative Intelligence & Ground Truth**: Utilize multimodal Gemini models (via Google Vertex AI ADC Service Account or Gemini API) combined with real-time official government monitoring station cross-verification (CPCB / Open-Meteo) to flag anomalies and prevent hallucinations.
3. **Traceability & Data Gap Auditing**: Explicitly flag missing parameters (e.g. unrecorded SO2, absent wind speeds) and calculate confidence ratings for every deduction.
4. **Role-Based Prioritized Interventions**: Contextualize actions across 5 distinct civic personas:
   - **Ward Officers / Municipal Admin**: Anti-smog sprayers, mechanized sweepers, industrial stop-work notices, traffic diversions.
   - **Housing Societies (RWAs)**: Perimeter misting, diesel generator (DG) curtailment, resident alerts.
   - **Schools & Educational Bodies**: Suspension of outdoor sports and morning assemblies, classroom air filtration.
   - **Commercial & Construction Operators**: Mandatory dust tarpaulins, HVAC filtration, worker shift rotations.
   - **Citizens & Vulnerable Populations**: Stratified health advisories for children, elderly, and respiratory patients in regional languages (Hindi, Marathi, Bengali, Tamil, etc.).
5. **Interactive Clarification & Authority Escalation**: Formulate clarifying questions for missing local conditions and generate official pre-filled escalation notices with designated government officers under Section 133 CrPC / Air Act 1981.
6. **Brief-to-Brief Historical Delta**: Calculate rate of change ($\Delta AQI$), hotspot shifts, and intervention impact against the previous recorded brief.
7. **Strict Engineering Standards**: Pure Vanilla HTML5, CSS3, modern ES6+ JavaScript, and native Node.js. Zero external UI/CSS frameworks (no Tailwind, Bootstrap, etc.) using `vw`, `vh`, `rem`, and `clamp()` for universal mobile and desktop responsiveness. Zero-dependency native HTML5 Canvas charting engine.
8. **Security, RBAC & Persistence**: Firebase Authentication with profile fields (Designation, Address, Pincode), role-based permissions, local IndexedDB/localStorage persistence, and an automated 30-minute background sync pulse with manual refresh.

---

## 3. Specification & Deliverables Index

Detailed architectural documentation has been established across the project repository:
* 📄 **[CivicAQI_Executive_Summary.pdf](file:///k:/manglik/manglik-site/Civic/CivicAQI_Executive_Summary.pdf)**: Complete 2-page print-ready PDF summary.
* 📄 **[PRD.md](file:///k:/manglik/manglik-site/Civic/PRD.md)**: Product Requirements Document detailing user personas, functional specifications (FR-1 to FR-10), NFRs, and KPIs.
* 📄 **[TRD.md](file:///k:/manglik/manglik-site/Civic/TRD.md)**: Technical Requirements Document defining system topology, API contracts (`/api/analyze`, `/api/live-gov-data`, `/api/history`, `/api/chat/stream`, `/api/assign-action`), zero-dependency native Canvas charting pipeline, and security boundaries.
* 📄 **[DESIGN.md](file:///k:/manglik/manglik-site/Civic/DESIGN.md)**: System & UI/UX Design Document containing Mermaid architecture flows, responsive wireframe layouts, unit scaling formulas (`rem`, `vw`, `vh`), delta diff engine, and escalation workflows.
* 📄 **[PROMPTS.md](file:///k:/manglik/manglik-site/Civic/PROMPTS.md)**: Master Prompt Engineering specifications for multimodal extraction, messy table normalization, executive briefing synthesis (200-300 words), role-based prioritization, and multi-lingual vulnerable citizen advisories.
* 📄 **[PROJECT_SUMMARY.md](file:///k:/manglik/manglik-site/Civic/PROJECT_SUMMARY.md)**: GitHub Repository Description, Tags, and High-Impact Project Overview.

---

## 4. System Architecture & Flow

```
+-----------------------------------------------------------------------------------+
|                              CLIENT TIER (Browser)                                |
|  - Vanilla HTML5 Semantic DOM + Pure CSS3 (Responsive via vw, vh, rem, clamp)      |
|  - Native HTML5 2D Canvas Charting Engine (Zero Chart.js/D3 dependencies)         |
|  - Real-time SSE Token Streaming Chatbot Drawer                                    |
|  - Firebase Auth Client (Identity Toolkit REST + Local Profile Store)              |
+----------------------------------------^------------------------------------------+
                                         | REST / SSE / JSON
+----------------------------------------v------------------------------------------+
|                         APPLICATION SERVER (Node.js)                              |
|  - Native Node.js Server ('http', 'https', 'crypto', 'fs') with Zero Dependencies  |
|  - Google Cloud ADC (Service Account RS256 JWT Signing) -> Vertex AI Gemini API   |
|  - Live Government AQI Aggregator & Validator (Open-Meteo & CPCB Ground Grid)     |
|  - Brief-to-Brief Historical Delta Diff Engine (Delta AQI calculation)            |
|  - Role-Based Access Control (Admin Action Assignment vs Public Intervention Form)|
|  - 30-Minute Local Snapshot Ring Buffer (data/history.json)                       |
+-----------------------------------------------------------------------------------+
```

---

## 5. Zero-Dependency Engineering Standards

* **No CSS Frameworks**: Strictly pure CSS3 using fluid `clamp()`, `rem`, `vw`, and `vh` units.
* **No JavaScript Bundlers / UI Frameworks**: Pure Vanilla ES6+ running directly in modern browsers.
* **No External Charting Libraries**: Custom-built HTML5 2D Canvas engine (`public/chart-engine.js`) rendering Bezier curves, dual Y-axis grids, AQI severity color bands, and multi-pollutant safety limit bars.
* **No Backend npm Packages**: 100% native Node.js standard library modules (`http`, `https`, `crypto`, `fs`, `path`, `os`, `url`).

---

## 6. Quick Start & Execution Guide

### Prerequisites
* Node.js v18 or higher installed on your system.

### Running the Platform
1. **Clone the repository**:
   ```bash
   git clone https://github.com/ujjawalmittal/promptswar.git
   cd promptswar
   ```
2. **Start the server (No `npm install` needed!)**:
   ```bash
   node server.js
   ```
3. **Open in your browser**:
   Navigate to `http://localhost:3000`

### Authentication & AI Configuration
* **Google Cloud ADC (Service Account)**: Configure `GOOGLE_APPLICATION_CREDENTIALS` and `GCP_PROJECT_ID` in `.env` (copied from `.env.example`), OR upload/paste your Service Account `.json` file in the UI modal (**🔑 API & Auth Config**).
* **Gemini API Key**: If not using ADC, enter your direct Gemini API key in **🔑 API & Auth Config**.
* **Local Heuristic / Demo Mode**: The platform functions out-of-the-box with complete feature parity even without API credentials.
* **Firebase Authentication**: Sign in or register via **🔐 Login / Profile** with your Role, Designation, Address, and Pincode.

---

## 7. License & Credits
* Developed for the **Promptswar AI Challenge**.
* Built with pure Vanilla Web Standards & Google Vertex AI Gemini.
* Licensed under the MIT License.

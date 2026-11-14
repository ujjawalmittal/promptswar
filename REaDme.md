# CivicAQI — AI-Driven Civic Intelligence Platform
**Turning Raw, Messy Air Quality Data into Traceable, Hyper-Local Interventions**

---

## 1. Official Problem Statement
> *Develop an AI-driven civic intelligence solution that enables local authorities, housing societies, and ward-level teams to turn raw air quality data into actionable local interventions. The solution must leverage Generative AI as a core component to interpret pasted or uploaded data tables, including messy ones with inconsistent formats, units, or missing readings, and summarize trends and likely hotspots in plain language. It should recommend prioritized local actions suited to who is asking, since a ward officer, a housing society, and a school can each do different things. Every finding should be traceable to the underlying data, with data gaps and unreliable readings clearly flagged. The assistant should compare each new brief with the previous one to show what changed, and generate both an internal briefing note and a citizen advisory in multiple languages, written for different reading levels, with extra care for children, older adults, and people sensitive to poor air.*

---

## 2. Refined Problem Statement & Architectural Blueprint
To fulfill the official mandate and eliminate operational blindspots, the problem statement was systematically expanded to address real-world deployment challenges:
1. **Multimodal Raw Ingestion**: Ingest raw unstructured tables, mobile screenshots of digital display boards, CSV files, and multi-lingual citizen statements. Standardize them into unified SI units with complete source cell/pixel traceability.
2. **Generative Intelligence & Ground Truth**: Utilize multimodal Gemini models combined with real-time official government monitoring station cross-verification (CPCB / OpenAQ) to flag anomalies and prevent hallucinations.
3. **Traceability & Data Gap Auditing**: Explicitly flag missing parameters (e.g. unrecorded SO2, absent wind speeds) and calculate confidence ratings for every deduction.
4. **Role-Based Prioritized Interventions**: Contextualize actions across 5 distinct civic personas:
   - **Ward Officers / Municipal Admin**: Anti-smog sprayers, mechanized sweepers, industrial stop-work notices, traffic diversions.
   - **Housing Societies (RWAs)**: Perimeter misting, diesel generator (DG) curtailment, resident alerts.
   - **Schools & Educational Bodies**: Suspension of outdoor sports and morning assemblies, classroom air filtration.
   - **Commercial & Construction Operators**: Mandatory dust tarpaulins, HVAC filtration, worker shift rotations.
   - **Citizens & Vulnerable Populations**: Stratified health advisories for children, elderly, and respiratory patients in regional languages (Hindi, Marathi, Bengali, Tamil, etc.).
5. **Interactive Clarification & Authority Escalation**: Formulate clarifying questions for missing local conditions and generate official pre-filled escalation notices with designated government officers.
6. **Brief-to-Brief Historical Delta**: Calculate rate of change ($\Delta AQI$), hotspot shifts, and intervention impact against the previous recorded brief.
7. **Strict Engineering Standards**: Pure Vanilla HTML5, CSS3, modern ES6+ JavaScript, and native Node.js. Zero external UI/CSS frameworks (no Tailwind, Bootstrap, etc.) using `vw`, `vh`, `rem`, and `clamp()` for universal mobile and desktop responsiveness. Zero-dependency native HTML5 Canvas charting engine.
8. **Security, RBAC & Persistence**: Firebase Authentication with profile fields (Designation, Address, Pincode), role-based permissions, local IndexedDB/localStorage persistence, and an automated 30-minute background sync pulse with manual refresh.

---

## 3. Specification & Design Deliverables
Detailed architectural documentation has been established across the project repository:
* 📄 **[PRD.md](file:///k:/manglik/manglik-site/Civic/PRD.md)**: Product Requirements Document detailing user personas, functional specifications (FR-1 to FR-10), NFRs, and KPIs.
* 📄 **[TRD.md](file:///k:/manglik/manglik-site/Civic/TRD.md)**: Technical Requirements Document defining system topology, API contracts (`/api/analyze`, `/api/live-gov-data`, `/api/history`), zero-dependency native Canvas charting pipeline, and security boundaries.
* 📄 **[DESIGN.md](file:///k:/manglik/manglik-site/Civic/DESIGN.md)**: System & UI/UX Design Document containing Mermaid architecture flows, responsive wireframe layouts, unit scaling formulas (`rem`, `vw`, `vh`), delta diff engine, and escalation workflows.
* 📄 **[PROMPTS.md](file:///k:/manglik/manglik-site/Civic/PROMPTS.md)**: Master Prompt Engineering specifications for multimodal extraction, messy table normalization, executive briefing synthesis (200-300 words), role-based prioritization, and multi-lingual vulnerable citizen advisories.

---

## 4. Project Structure
```
k:/manglik/manglik-site/Civic/
├── PRD.md                 # Product Requirements Document
├── TRD.md                 # Technical Requirements Document
├── DESIGN.md              # System Architecture & UI/UX Design
├── PROMPTS.md             # Master LLM & Multimodal Prompts
├── REaDme.md              # Executive Overview & Problem Statement Refinement
├── server.js              # Native Node.js Server & API Gateway
├── data/
│   └── history.json       # Historical briefs & 30-min snapshot cache
└── public/
    ├── index.html         # Semantic HTML5 Single Page Application
    ├── style.css          # Pure CSS3 Design System (rem/vw/vh responsive, no frameworks)
    ├── app.js             # Client Application Orchestrator & State Manager
    ├── chart-engine.js    # Native HTML5 2D Canvas Charting Engine (Zero dependencies)
    └── mock-data.js       # Verified Real-World Indian & Global AQI Benchmarks
```

---

## 5. Quick Start & Execution Guide
1. **Prerequisites**: Node.js v18 or higher installed.
2. **Start the Application**:
   ```bash
   node server.js
   ```
3. **Open in Browser**:
   Navigate to `http://localhost:3000` to interact with the Civic Intelligence Platform.

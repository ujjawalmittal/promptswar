# Product Requirements Document (PRD)
## Project Name: CivicAQI — AI-Driven Civic Intelligence & Hyper-Local Air Quality Action Platform
**Version:** 1.0.0  
**Status:** Approved for Implementation  
**Target Stakeholders:** Ward Officers, Municipal Corporations, Housing Societies (RWAs), Schools/Universities, Health Facilities, Commercial Establishments, and Citizens.

---

### 1. Executive Summary & Vision
Air quality data is frequently collected in siloed, heterogeneous, and messy formats: unstructured CSVs, PDF bulletins, WhatsApp forward tables, handwritten logs, photos of outdoor monitoring boards, and citizen complaints across multiple regional languages. Most existing platforms display passive AQI values without answering: *"What specific actions should our ward, school, or residential society take right now?"*

**CivicAQI** is an AI-driven civic intelligence system that converts messy, multi-source raw air pollution data into structured, traceable, and hyper-local interventions. Powered by multimodal Generative AI (Gemini) and cross-verified against real-time government monitoring data, the platform generates role-tailored action directives, brief-to-brief delta comparisons, automated data-gap diagnostics, and multi-lingual citizen advisories tailored for vulnerable populations.

---

### 2. Core Problem Statement & User Personas

#### 2.1 The Problem
1. **Messy & Fragmented Data Ingestion**: Local authorities and RWAs receive data with inconsistent units ($\mu g/m^3$, ppm, AQI index), missing timestamps, incomplete rows, or photos of physical display units.
2. **Lack of Actionable Context**: A generic AQI of 380 ("Severe") does not tell a school principal whether to move sports indoors, nor does it tell an RWA manager to restrict diesel generators or a ward officer to dispatch water sprinklers to specific construction corridors.
3. **Absence of Accountability & Traceability**: Raw warnings rarely map to responsible local officers, nor do they track whether pollution is rising or falling compared to the last shift/report.
4. **Communication Gap for Vulnerable Demographics**: General advisories fail to provide tailored instructions for children, elderly residents, pregnant women, asthmatics, and outdoor workers in their native languages.

#### 2.2 Target User Personas & Role-Based Needs

| Persona | Designation / Org | Primary Needs & Actions |
| :--- | :--- | :--- |
| **Ward Officer / Admin** | Municipal Ward In-charge, Pollution Control Board Officer | Hotspot identification by pincode, deployment of smog guns/anti-smog sprinklers, industrial stop-work notices, traffic diversions, official escalation forms. |
| **Housing Society Admin** | RWA President, Facility Manager | DG set curtailment, perimeter misting systems, green buffer maintenance, advisory broadcasts to residents, vehicle idling limits. |
| **School Administrator** | Principal, Sports Director | Timetable adjustments (morning assemblies, sports suspensions), indoor air purifier activation, air-quality health notifications to parents. |
| **Commercial Manager** | Mall / Office / Construction Site Manager | HVAC filter upgrading (HEPA/MERV 13+), mandatory dust-screen tarpaulins, staggered worker shifts during peak morning/evening smog. |
| **Local Citizen / Parent** | Resident, Caregiver | Plain-language advisory in local languages (Hindi, Marathi, Tamil, Bengali, etc.), mask recommendations, medication alerts, reporting localized trash burning. |

---

### 3. Detailed Functional Requirements

#### FR-1: Multimodal Raw Data Ingestion & Normalization
* **FR-1.1**: Accept raw inputs in diverse formats:
  - Direct paste of raw tables (tab-separated, comma-separated, misaligned whitespace).
  - Unstructured plain text / statements / citizen reports in any language.
  - File upload (`.csv`, `.tsv`, `.txt`, `.json`).
  - Image upload (`.png`, `.jpg`, `.jpeg`, `.webp`) capturing physical monitors, paper logs, or screenshot dashboards.
* **FR-1.2**: Generative parsing using Gemini to normalize data into standard SI metrics:
  - PM2.5 ($\mu g/m^3$), PM10 ($\mu g/m^3$), NO2 (ppb or $\mu g/m^3$), SO2, CO, O3, Temperature ($^\circ C$), Humidity (%), and composite National AQI (NAQI / US-EPA).
* **FR-1.3**: Traceability & Confidence Audit:
  - Flag missing timestamps, missing pollutant values, and uncalibrated sensor anomalies.
  - Every generated insight must link back to specific row/field coordinates in the raw input.

#### FR-2: Live Government Data Verification
* **FR-2.1**: Query live official government monitoring stations (CPCB, OpenAQ, state pollution control boards) using the user's target Pincode / Ward name.
* **FR-2.2**: Calculate variance ($\Delta$) between ingested raw values and official station readings to detect hyper-local micro-climate anomalies vs. data errors.

#### FR-3: Automated Executive Briefing (200–300 Words)
* **FR-3.1**: Synthesize an objective, high-impact executive brief (strictly 200–300 words) summarizing:
  - Overall severity index and primary driving pollutant (e.g., PM2.5 spike from biomass or NO2 from vehicular traffic).
  - Geographic epicenter / pinpointed hotspot pincodes.
  - Immediate trends (rising, plateauing, dispersing).
  - Explicit flags for unverified or missing data.

#### FR-4: Interactive Native Data Visualizations
* **FR-4.1**: Render lightweight, dependency-free HTML5 `<canvas>` and SVG charts:
  - Time-series trend chart (24-hour / multi-period AQI & particulate progression).
  - Multi-pollutant distribution bar & radar graphs (PM2.5, PM10, NO2, CO, SO2, O3 against safe thresholds).
  - Hotspot Geographic Pincode Matrix displaying spatial concentration tiers (Good, Moderate, Poor, Very Poor, Severe, Hazardous).

#### FR-5: Brief-to-Brief Historical Delta Comparison
* **FR-5.1**: Maintain session history with automatic timestamps.
* **FR-5.2**: Provide an automated comparative delta analysis against the previous brief:
  - $\Delta$ AQI change (+/- points and percentage).
  - Newly emerged hotspots vs. resolving hotspots.
  - Effectiveness score of previous interventions.

#### FR-6: Role-Based Prioritized Action Recommendations
* **FR-6.1**: Produce distinct, prioritized (Immediate vs. Precautionary) action matrices for:
  1. Ward Officers (Civic/Enforcement)
  2. Housing Society / RWAs (Community/Facilities)
  3. School & Educational Institutions (Child Health/Schedules)
  4. Commercial & Industrial Operators (Operations/HVAC)
  5. General Citizens & Households
* **FR-6.2**: Prioritization scale: **P0 (Immediate Life/Health Safety - 0 to 2 hrs)**, **P1 (Operational Mitigation - 2 to 12 hrs)**, **P2 (Sustained Monitoring - 24+ hrs)**.

#### FR-7: Intelligent Clarification & Responsible Authority Dispatch
* **FR-7.1**: The system dynamically flags ambiguous data and prompts the user with targeted questions (e.g., *"Is there active construction within 500m of Pincode 110085?"*).
* **FR-7.2**: Contact directory and direct pre-filled escalation forms addressed to relevant municipal officials (Sub-Divisional Magistrate, Ward Junior Engineer, Fire Services for stubble/waste burning, Traffic Police).

#### FR-8: Multi-Lingual Citizen Advisories & Vulnerability Stratification
* **FR-8.1**: Output tailored advisories across 6+ languages (English, Hindi, Marathi, Bengali, Tamil, Telugu, etc.).
* **FR-8.2**: Readability customization:
  - Simple / Visual reading level for primary schools and non-technical citizens.
  - Detailed / Technical briefing for ward engineers and medical practitioners.
* **FR-8.3**: Demographic segmentation:
  - Children (school outdoor restrictions, mask fit).
  - Older Adults & Asthmatics (indoor air purification, medication availability).
  - Outdoor workers & commuters (N95 guidelines, shift rotations).

#### FR-9: Authentication, RBAC & Profile Management
* **FR-9.1**: Firebase Authentication (Email/Password, Google OAuth, and Offline/Guest Simulation mode).
* **FR-9.2**: Profile fields: Full Name, Role/Designation, Organization/Department, Physical Address, Primary Pincode.
* **FR-9.3**: Privilege Tiers:
  - **Super Admin**: System governance, agency assignment, global overrides.
  - **Civic Official**: Action assignment, dispatch issuance, verified government data sync.
  - **Institutional / RWA Lead**: Internal action execution, community broadcasting.
  - **Resident / Citizen**: Data viewing, reporting local incidents, advisory access.

#### FR-10: Local Persistence & Auto-Refresh Sync
* **FR-10.1**: Store historical briefs, uploads, and logs locally using `IndexedDB` / `localStorage` with offline resilience.
* **FR-10.2**: Automated periodic background synchronization every 30 minutes, alongside an on-demand "Sync Now" button.

---

### 4. Non-Functional Requirements (NFR)
1. **Performance**: Initial parse and Gemini inference response under 4.0 seconds; native canvas rendering in under 50ms.
2. **Zero Framework Dependencies**: Pure Vanilla HTML5, CSS3, ES6+ JavaScript, and native Node.js. No React, Angular, Vue, Tailwind, Bootstrap, Chart.js, or jQuery.
3. **Responsive UI**: 100% fluid mobile, tablet, and desktop rendering strictly using `rem`, `vw`, `vh`, `clamp()`, and modern CSS Grid/Flexbox.
4. **Security & Privacy**: Client-side API key protection via Node.js proxy; sanitized user input; OWASP compliance against XSS and injection attacks.
5. **Accessibility**: WCAG 2.1 AA compliant contrast ratios, keyboard navigable, screen-reader friendly semantic tags.

---

### 5. Success Metrics & KPIs
* **Data Ingestion Fidelity**: $\ge 98\%$ accurate entity extraction from corrupted tables and image photos.
* **Action Applicability**: $> 90\%$ user satisfaction rating on role-specific relevance.
* **Response Velocity**: $< 3$ seconds to generate complete briefing and localized advisories.
* **Zero Dependency Burden**: $0$ external CSS/JS CDN dependencies required for core rendering.

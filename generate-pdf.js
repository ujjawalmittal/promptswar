/**
 * Native Pure Node.js PDF-1.4 Generator
 * Zero external dependencies
 */

const fs = require('fs');
const path = require('path');

function createPdf() {
  const objects = [];
  function addObject(content) {
    const objNum = objects.length + 1;
    objects.push({ num: objNum, content });
    return objNum;
  }

  // Escape special chars in PDF text
  function escapePdfText(text) {
    return text.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
  }

  // Page 1 Content Stream
  let p1 = [];
  // Banner background
  p1.push('0.96 0.97 0.99 rg 30 720 535 90 re f');
  p1.push('0.15 0.39 0.92 RG 2 w 30 720 m 565 720 l S');

  // Title & Subtitle
  p1.push('BT /F2 20 Tf 0.06 0.09 0.16 rg 45 780 Td (CivicAQI - AI Civic Intelligence Platform) Tj ET');
  p1.push('BT /F2 11 Tf 0.15 0.39 0.92 rg 45 760 Td (Executive Summary & Operational Mandate) Tj ET');
  p1.push('BT /F1 9 Tf 0.39 0.45 0.55 rg 45 740 Td (Architecture: Zero-Framework Node.js | Google ADC & Vertex AI Gemini | Firebase RBAC) Tj ET');
  p1.push('BT /F2 9 Tf 0.39 0.45 0.55 rg 440 740 Td (Release: promptswar) Tj ET');

  // Section 1: Problem Statement
  p1.push('0.15 0.39 0.92 rg 45 690 4 16 re f');
  p1.push('BT /F2 13 Tf 0.06 0.09 0.16 rg 55 693 Td (1. Official Civic Problem Mandate) Tj ET');

  p1.push('0.97 0.98 0.99 rg 45 560 505 120 re f 0.88 0.91 0.94 RG 1 w 45 560 505 120 re S');
  const mandateLines = [
    '"Develop an AI-driven civic intelligence solution that enables local authorities, housing societies,',
    'and ward-level teams to turn raw air quality data into actionable local interventions. The solution',
    'must leverage Generative AI as a core component to interpret pasted or uploaded data tables,',
    'including messy ones with inconsistent formats, units, or missing readings, and summarize trends',
    'and likely hotspots in plain language. It should recommend prioritized local actions suited to who',
    'is asking, since a ward officer, a housing society, and a school can each do different things. Every',
    'finding should be traceable to the underlying data, with data gaps and unreliable readings clearly flagged.',
    'The assistant should compare each new brief with the previous one to show what changed, and generate',
    'both an internal briefing note and a citizen advisory in multiple languages, written for different reading levels."'
  ];
  mandateLines.forEach((line, idx) => {
    p1.push(`BT /F1 9 Tf 0.2 0.25 0.33 rg 55 ${660 - (idx * 12)} Td (${escapePdfText(line)}) Tj ET`);
  });

  // Section 2: Architectural Specifications
  p1.push('0.15 0.39 0.92 rg 45 525 4 16 re f');
  p1.push('BT /F2 13 Tf 0.06 0.09 0.16 rg 55 528 Td (2. Master Engineering Specifications Built) Tj ET');

  const specs = [
    ['PRD.md', 'Product Requirements Document detailing user personas, FR-1 to FR-10 functional specs & KPIs.'],
    ['TRD.md', 'Technical Requirements Document defining zero-dependency server topology, APIs & security.'],
    ['DESIGN.md', 'System Architecture & UI/UX Design covering responsive vw/vh/rem units, Delta algorithm & flow.'],
    ['PROMPTS.md', 'Master Prompt Engineering specifications for Gemini 2.5 Flash/Pro multimodal reasoning & JSON schema.']
  ];

  specs.forEach((s, idx) => {
    const y = 495 - (idx * 26);
    p1.push(`0.95 0.97 1.0 rg 45 ${y} 505 22 re f 0.85 0.9 0.98 RG 0.5 w 45 ${y} 505 22 re S`);
    p1.push(`BT /F2 9.5 Tf 0.15 0.39 0.92 rg 55 ${y + 6} Td (${escapePdfText(s[0])}:) Tj ET`);
    p1.push(`BT /F1 9 Tf 0.2 0.25 0.33 rg 140 ${y + 6} Td (${escapePdfText(s[1])}) Tj ET`);
  });

  // Section 3: Core Innovations
  p1.push('0.15 0.39 0.92 rg 45 375 4 16 re f');
  p1.push('BT /F2 13 Tf 0.06 0.09 0.16 rg 55 378 Td (3. High-Impact System Capabilities) Tj ET');

  const capabilities = [
    '[*] Multimodal Ingestion: Ingests unstructured CSVs, raw tables, WhatsApp forwards & display monitor photos.',
    '[*] Live Ground Truth: Cross-validates against live Open-Meteo & India Post APIs, correlated with CPCB stations.',
    '[*] 200-300 Word Executive Brief: High-impact synthesis documenting severity, epicenter pincodes & gaps.',
    '[*] Native Canvas 2D Charts: Zero-dependency Bezier curves and multi-metric pollutant safety limit bars.',
    '[*] Brief-to-Brief Delta (Delta AQI): Tracks percentage changes and categorized trajectories (Worsening/Improving).',
    '[*] Google ADC & Vertex AI: Authenticates via Service Account RS256 JWT assertion with SSE token streaming.',
    '[*] Firebase Auth & Civic RBAC: Enforces role-based permissions with designation, address & pincode persistence.',
    '[*] 30-Minute Local Sync Pulse: Background synchronization timer with on-demand manual trigger & JSON log.'
  ];
  capabilities.forEach((cap, idx) => {
    p1.push(`BT /F1 9 Tf 0.15 0.2 0.28 rg 55 ${350 - (idx * 16)} Td (${escapePdfText(cap)}) Tj ET`);
  });

  // Footer page 1
  p1.push('0.85 0.88 0.92 RG 1 w 45 50 m 550 50 l S');
  p1.push('BT /F1 8 Tf 0.5 0.55 0.65 rg 45 38 Td (CivicAQI Platform Summary - Public Release promptswar) Tj ET');
  p1.push('BT /F1 8 Tf 0.5 0.55 0.65 rg 510 38 Td (Page 1 of 2) Tj ET');

  // Page 2 Content Stream
  let p2 = [];
  // Header page 2
  p2.push('0.15 0.39 0.92 RG 2 w 30 800 m 565 800 l S');
  p2.push('BT /F2 14 Tf 0.06 0.09 0.16 rg 45 810 Td (CivicAQI - Stakeholder Action Matrix & Governance) Tj ET');

  // Section 4: 5-Persona Action Matrix
  p2.push('0.15 0.39 0.92 rg 45 770 4 16 re f');
  p2.push('BT /F2 13 Tf 0.06 0.09 0.16 rg 55 773 Td (4. Role-Tailored Prioritized Intervention Matrix) Tj ET');

  const matrix = [
    {
      role: 'Ward Officer / Municipal Admin (Admin Privilege)',
      p0: 'Deploy mobile high-pressure water misting guns to arterial corridors; halt uncurtained excavation.',
      p1: 'Schedule nighttime mechanized vacuum sweeping; coordinate traffic freight diversions.'
    },
    {
      role: 'Housing Society / RWA (Community Facility)',
      p0: 'Curtail non-essential diesel generator (DG) runtime; activate driveway boundary misting twice daily.',
      p1: 'Issue resident WhatsApp smog warnings; enforce strict cab and delivery gate no-idling rules.'
    },
    {
      role: 'School / University Authority (Campus Health)',
      p0: 'Suspend all outdoor sports, morning assemblies & recess; switch classroom HEPA purifiers to max.',
      p1: 'Mandate N95 masks during bus transit; equip campus infirmary with nebulizers & oxygen triage.'
    },
    {
      role: 'Commercial & Construction Leads (Operations)',
      p0: 'Upgrade HVAC filtration to MERV 13 with indoor air recirculation; tarp all cement/sand piles.',
      p1: 'Stagger morning worker arrival shifts away from temperature inversion; inspect diesel haulers.'
    },
    {
      role: 'Local Citizens & Households (Public Advisory)',
      p0: 'Avoid outdoor morning cardio; wear certified, fitted N95/FFP2 respirators during necessary transit.',
      p1: 'Submit verified geo-tagged reports for illegal open waste or leaf burning to the municipal desk.'
    }
  ];

  matrix.forEach((m, idx) => {
    const y = 735 - (idx * 55);
    p2.push(`0.97 0.98 0.99 rg 45 ${y} 505 50 re f 0.88 0.91 0.95 RG 0.5 w 45 ${y} 505 50 re S`);
    p2.push(`BT /F2 9.5 Tf 0.15 0.39 0.92 rg 55 ${y + 36} Td (${escapePdfText(m.role)}) Tj ET`);
    p2.push(`BT /F2 8.5 Tf 0.8 0.1 0.1 rg 55 ${y + 22} Td (P0 [Immediate]:) Tj ET`);
    p2.push(`BT /F1 8.5 Tf 0.15 0.2 0.28 rg 135 ${y + 22} Td (${escapePdfText(m.p0)}) Tj ET`);
    p2.push(`BT /F2 8.5 Tf 0.1 0.5 0.2 rg 55 ${y + 8} Td (P1 [Precautionary]:) Tj ET`);
    p2.push(`BT /F1 8.5 Tf 0.15 0.2 0.28 rg 165 ${y + 8} Td (${escapePdfText(m.p1)}) Tj ET`);
  });

  // Section 5: Legal Directive & Multi-lingual Advisories
  p2.push('0.15 0.39 0.92 rg 45 435 4 16 re f');
  p2.push('BT /F2 13 Tf 0.06 0.09 0.16 rg 55 438 Td (5. Multi-Lingual Citizen Advisories & Legal Provisions) Tj ET');

  p2.push('0.96 0.97 1.0 rg 45 355 505 68 re f 0.85 0.9 0.98 RG 0.5 w 45 355 505 68 re S');
  p2.push('BT /F2 9.5 Tf 0.06 0.09 0.16 rg 55 405 Td (Vulnerability Stratification & Regional Support:) Tj ET');
  p2.push('BT /F1 8.5 Tf 0.2 0.25 0.33 rg 55 390 Td (Supported Languages: English, Hindi, Marathi, Tamil, Bengali with simplified readability scales.) Tj ET');
  p2.push('BT /F1 8.5 Tf 0.2 0.25 0.33 rg 55 376 Td (Children & Students: School sport restrictions, mask fit and indoor recess.) Tj ET');
  p2.push('BT /F1 8.5 Tf 0.2 0.25 0.33 rg 55 362 Td (Older Adults & Asthmatics: Air purification, window seals, medication readiness & smog walks.) Tj ET');

  p2.push('0.99 0.97 0.96 rg 45 270 505 72 re f 0.95 0.88 0.85 RG 0.5 w 45 270 505 72 re S');
  p2.push('BT /F2 9.5 Tf 0.6 0.2 0.1 rg 55 324 Td (Statutory Civic Directive - Section 133 CrPC / Air Act 1981:) Tj ET');
  p2.push('BT /F1 8.5 Tf 0.2 0.25 0.33 rg 55 308 Td (The platform generates formal environmental directives with official reference codes pre-filled with) Tj ET');
  p2.push('BT /F1 8.5 Tf 0.2 0.25 0.33 rg 55 294 Td (measured PM2.5/AQI, official CPCB station correlation, and mandated on-site compliance timelines,) Tj ET');
  p2.push('BT /F1 8.5 Tf 0.2 0.25 0.33 rg 55 280 Td (addressed directly to the Sub-Divisional Magistrate (SDM) & Executive Ward Engineer.) Tj ET');

  // Section 6: Zero Framework Tech Stack Summary
  p2.push('0.15 0.39 0.92 rg 45 240 4 16 re f');
  p2.push('BT /F2 13 Tf 0.06 0.09 0.16 rg 55 243 Td (6. Strict Zero-Dependency Technical Compliance) Tj ET');

  const stackLines = [
    '[*] Runtime: Pure native Node.js (v18+) using built-in http, https, crypto, fs modules without npm packages.',
    '[*] Frontend: Pure Vanilla HTML5 & CSS3 using responsive vw, vh, rem, and clamp() typography and scaling.',
    '[*] Visualizations: Native HTML5 2D Canvas charting engine with zero D3 / Chart.js dependencies.',
    '[*] Google Cloud ADC: Service Account RS256 JWT assertion exchange for Vertex AI Gemini multimodal inference.'
  ];
  stackLines.forEach((sl, idx) => {
    p2.push(`BT /F1 8.5 Tf 0.15 0.2 0.28 rg 55 ${220 - (idx * 14)} Td (${escapePdfText(sl)}) Tj ET`);
  });

  // Footer page 2
  p2.push('0.85 0.88 0.92 RG 1 w 45 50 m 550 50 l S');
  p2.push('BT /F1 8 Tf 0.5 0.55 0.65 rg 45 38 Td (CivicAQI Platform Summary - Public Release promptswar) Tj ET');
  p2.push('BT /F1 8 Tf 0.5 0.55 0.65 rg 510 38 Td (Page 2 of 2) Tj ET');

  const stream1 = p1.join('\n');
  const stream2 = p2.join('\n');

  // Build Objects
  // 1: Catalog
  addObject('<< /Type /Catalog /Pages 2 0 R >>');
  // 2: Pages
  addObject('<< /Type /Pages /Kids [3 0 R 4 0 R] /Count 2 >>');
  // 3: Page 1
  addObject('<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 5 0 R /Resources << /Font << /F1 7 0 R /F2 8 0 R >> >> >>');
  // 4: Page 2
  addObject('<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 6 0 R /Resources << /Font << /F1 7 0 R /F2 8 0 R >> >> >>');
  // 5: Stream 1
  addObject(`<< /Length ${Buffer.byteLength(stream1)} >>\nstream\n${stream1}\nendstream`);
  // 6: Stream 2
  addObject(`<< /Length ${Buffer.byteLength(stream2)} >>\nstream\n${stream2}\nendstream`);
  // 7: Font Helvetica
  addObject('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>');
  // 8: Font Helvetica-Bold
  addObject('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>');

  // Assembly
  let out = '%PDF-1.4\n';
  const xrefOffsets = [0];

  objects.forEach(obj => {
    xrefOffsets.push(Buffer.byteLength(out, 'binary'));
    out += `${obj.num} 0 obj\n${obj.content}\nendobj\n`;
  });

  const xrefStart = Buffer.byteLength(out, 'binary');
  out += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (let i = 1; i <= objects.length; i++) {
    out += `${String(xrefOffsets[i]).padStart(10, '0')} 00000 n \n`;
  }
  out += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF\n`;

  return out;
}

if (require.main === module) {
  const pdfData = createPdf();
  const targetPath = path.join(__dirname, 'CivicAQI_Executive_Summary.pdf');
  try {
    fs.writeFileSync(targetPath, Buffer.from(pdfData, 'binary'));
    console.log('PDF written to file');
  } catch (e) {
    console.log('PDF_BASE64_START');
    console.log(Buffer.from(pdfData, 'binary').toString('base64'));
    console.log('PDF_BASE64_END');
  }
}

module.exports = { createPdf };

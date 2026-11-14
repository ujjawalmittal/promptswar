/**
 * CivicAQI Canvas Charting Engine
 * Pure Vanilla JavaScript & HTML5 2D Canvas
 * Zero external charting dependencies (No Chart.js, No D3)
 */

window.CivicCharts = (function() {
  'use strict';

  // Helper to handle HiDPI / Retina displays cleanly
  function setupCanvas(canvas) {
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
    return { ctx, width: rect.width, height: rect.height };
  }

  // Color mappings based on National AQI scale
  function getAqiColor(value) {
    if (value <= 50) return '#10b981';   // Good (Green)
    if (value <= 100) return '#84cc16';  // Satisfactory (Light Green)
    if (value <= 200) return '#eab308';  // Moderate (Yellow)
    if (value <= 300) return '#f97316';  // Poor (Orange)
    if (value <= 400) return '#ef4444';  // Very Poor (Red)
    return '#881337';                    // Severe / Hazardous (Maroon)
  }

  /**
   * Renders a 24-Hour / Historical Line Trend Chart
   */
  function renderLineTrend(canvasId, labels, dataPoints, options = {}) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const { ctx, width, height } = setupCanvas(canvas);

    ctx.clearRect(0, 0, width, height);

    const padLeft = 45;
    const padRight = 20;
    const padTop = 30;
    const padBottom = 35;
    const chartW = width - padLeft - padRight;
    const chartH = height - padTop - padBottom;

    if (!dataPoints || dataPoints.length === 0) {
      ctx.fillStyle = '#94a3b8';
      ctx.font = '14px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('No historical trend data available', width / 2, height / 2);
      return;
    }

    const maxVal = Math.max(500, Math.ceil(Math.max(...dataPoints) * 1.15 / 50) * 50);
    const minVal = 0;

    // Draw horizontal grid lines and Y-axis values
    ctx.lineWidth = 1;
    ctx.strokeStyle = '#1e293b';
    ctx.fillStyle = '#64748b';
    ctx.font = '11px monospace';
    ctx.textAlign = 'right';

    const ySteps = 5;
    for (let i = 0; i <= ySteps; i++) {
      const val = Math.round(minVal + (maxVal - minVal) * (i / ySteps));
      const y = padTop + chartH - (i / ySteps) * chartH;

      ctx.beginPath();
      ctx.moveTo(padLeft, y);
      ctx.lineTo(padLeft + chartW, y);
      ctx.stroke();

      ctx.fillText(val, padLeft - 8, y + 4);
    }

    // AQI Safety Guideline threshold (e.g. 100 = Satisfactory, 200 = Moderate)
    const severeY = padTop + chartH - (400 / maxVal) * chartH;
    ctx.strokeStyle = 'rgba(239, 68, 68, 0.35)';
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(padLeft, severeY);
    ctx.lineTo(padLeft + chartW, severeY);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = '#ef4444';
    ctx.textAlign = 'right';
    ctx.fillText('Severe (400)', padLeft + chartW - 6, severeY - 4);

    // Compute point coordinates
    const points = dataPoints.map((val, idx) => {
      const x = padLeft + (idx / (dataPoints.length - 1)) * chartW;
      const y = padTop + chartH - ((val - minVal) / (maxVal - minVal)) * chartH;
      return { x, y, val };
    });

    // Draw Gradient Area below curve
    const grad = ctx.createLinearGradient(0, padTop, 0, padTop + chartH);
    grad.addColorStop(0, 'rgba(59, 130, 246, 0.45)');
    grad.addColorStop(0.7, 'rgba(59, 130, 246, 0.1)');
    grad.addColorStop(1, 'rgba(59, 130, 246, 0.0)');

    ctx.beginPath();
    ctx.moveTo(points[0].x, padTop + chartH);
    for (let i = 0; i < points.length; i++) {
      ctx.lineTo(points[i].x, points[i].y);
    }
    ctx.lineTo(points[points.length - 1].x, padTop + chartH);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();

    // Draw smoothed line
    ctx.beginPath();
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 2.5;
    for (let i = 0; i < points.length; i++) {
      if (i === 0) ctx.moveTo(points[i].x, points[i].y);
      else ctx.lineTo(points[i].x, points[i].y);
    }
    ctx.stroke();

    // Draw data circles and values
    points.forEach((pt, idx) => {
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, 4, 0, Math.PI * 2);
      ctx.fillStyle = getAqiColor(pt.val);
      ctx.fill();
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Top value label
      ctx.fillStyle = '#f8fafc';
      ctx.font = '10px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(pt.val, pt.x, pt.y - 8);

      // X-axis label
      if (labels && labels[idx]) {
        ctx.fillStyle = '#94a3b8';
        ctx.font = '10px sans-serif';
        ctx.fillText(labels[idx], pt.x, height - 12);
      }
    });
  }

  /**
   * Renders Multi-Pollutant Comparison Bar Chart with WHO / CPCB Safety Thresholds
   */
  function renderPollutantBars(canvasId, items) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const { ctx, width, height } = setupCanvas(canvas);

    ctx.clearRect(0, 0, width, height);

    const padLeft = 70;
    const padRight = 30;
    const padTop = 20;
    const padBottom = 30;
    const chartW = width - padLeft - padRight;
    const chartH = height - padTop - padBottom;

    if (!items || items.length === 0) return;

    const barHeight = Math.min(28, (chartH / items.length) * 0.65);
    const rowStep = chartH / items.length;

    // Find max value for normalization
    const maxVal = Math.max(...items.map(it => Math.max(it.value, it.safeLimit * 1.5)));

    items.forEach((item, idx) => {
      const y = padTop + idx * rowStep + (rowStep - barHeight) / 2;
      const barW = Math.max(4, (item.value / maxVal) * chartW);
      const safeX = padLeft + (item.safeLimit / maxVal) * chartW;

      // Label (e.g. PM2.5)
      ctx.fillStyle = '#cbd5e1';
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(item.name, padLeft - 10, y + barHeight / 2 + 4);

      // Background Track
      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.roundRect(padLeft, y, chartW, barHeight, 4);
      ctx.fill();

      // Actual Value Bar
      const isSevere = item.value > item.safeLimit * 2;
      const isElevated = item.value > item.safeLimit;
      const barColor = isSevere ? '#ef4444' : (isElevated ? '#f59e0b' : '#10b981');

      ctx.fillStyle = barColor;
      ctx.beginPath();
      ctx.roundRect(padLeft, y, barW, barHeight, 4);
      ctx.fill();

      // Safe limit marker line
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(safeX, y - 3);
      ctx.lineTo(safeX, y + barHeight + 3);
      ctx.stroke();
      ctx.setLineDash([]);

      // Value text inside / next to bar
      ctx.fillStyle = '#f8fafc';
      ctx.font = 'bold 11px monospace';
      ctx.textAlign = 'left';
      const textX = barW > 60 ? padLeft + barW - 55 : padLeft + barW + 8;
      ctx.fillText(`${item.value} ${item.unit}`, textX, y + barHeight / 2 + 4);
    });

    // Legend on bottom
    ctx.fillStyle = '#94a3b8';
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText('Dashed line: Safe 24-hr threshold', width - padRight, height - 8);
  }

  return {
    renderLineTrend,
    renderPollutantBars,
    getAqiColor
  };
})();

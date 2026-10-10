function clear(ctx, width, height) { ctx.setFillStyle('#FFFFFF'); ctx.fillRect(0, 0, width, height); }

function drawPie(canvasId, data, options = {}) {
  const ctx = wx.createCanvasContext(canvasId);
  const width = Number(options.width) || 320;
  const height = Number(options.height) || 220;
  const cx = Math.round(width * .28);
  const cy = Math.round(height * .5);
  const radius = Math.max(42, Math.min(height * .32, width * .2));
  clear(ctx, width, height);
  const total = data.reduce((sum, item) => sum + Number(item.value), 0);
  if (!total) {
    ctx.setFillStyle('#8B95A8');
    ctx.setFontSize(15);
    ctx.setTextAlign('center');
    ctx.fillText('暂无数据', cx, cy);
    ctx.draw(); return;
  }
  let start = -Math.PI / 2;
  data.forEach(item => {
    const angle = Number(item.value) / total * Math.PI * 2;
    ctx.beginPath(); ctx.moveTo(cx, cy); ctx.arc(cx, cy, radius, start, start + angle); ctx.setFillStyle(item.color); ctx.fill(); start += angle;
  });
  ctx.setFillStyle('#FFFFFF'); ctx.beginPath(); ctx.arc(cx, cy, radius * .58, 0, Math.PI * 2); ctx.fill();
  ctx.setFillStyle('#1D2638'); ctx.setFontSize(Math.max(13, Math.round(width / 24))); ctx.setTextAlign('center'); ctx.fillText('支出', cx, cy - 3);
  ctx.setFontSize(Math.max(14, Math.round(width / 21))); ctx.fillText(`¥${total.toFixed(0)}`, cx, cy + 20);
  ctx.setTextAlign('left');
  ctx.draw();
}

function drawBars(canvasId, data, unit = '分钟', options = {}) {
  const ctx = wx.createCanvasContext(canvasId);
  const width = Number(options.width) || 320; const height = Number(options.height) || 220;
  const left = Math.max(30, Math.round(width * .09)); const right = width - Math.max(12, Math.round(width * .03));
  const top = 30; const bottom = height - 38; const chartHeight = Math.max(80, bottom - top);
  clear(ctx, width, height);
  const max = Math.max(...data.map(item => item.value), 1);
  ctx.setStrokeStyle('#E9ECF3'); ctx.setLineWidth(1);
  for (let line = 0; line < 4; line += 1) { const y = top + line * chartHeight / 3; ctx.beginPath(); ctx.moveTo(left, y); ctx.lineTo(right, y); ctx.stroke(); }
  const slot = (right - left) / Math.max(data.length, 1); const barWidth = Math.min(34, slot * .58);
  data.forEach((item, index) => {
    const value = Number(item.value); const h = value / max * chartHeight; const x = left + slot * index + (slot - barWidth) / 2; const y = bottom - h;
    ctx.setFillStyle('#748FFC'); ctx.fillRect(x, y, barWidth, h);
    ctx.setFillStyle('#465065'); ctx.setFontSize(Math.max(10, Math.round(width / 34))); ctx.setTextAlign('center'); ctx.fillText(item.label, x + barWidth / 2, height - 13);
    if (value) { ctx.setFillStyle('#4263EB'); ctx.setFontSize(Math.max(9, Math.round(width / 38))); ctx.fillText(String(Math.round(value)), x + barWidth / 2, Math.max(top + 10, y - 6)); }
  });
  ctx.setTextAlign('left'); ctx.setFillStyle('#8B95A8'); ctx.setFontSize(Math.max(10, Math.round(width / 34))); ctx.fillText(`最高 ${Math.round(max)}${unit}`, left, 17); ctx.draw();
}

module.exports = { drawPie, drawBars };

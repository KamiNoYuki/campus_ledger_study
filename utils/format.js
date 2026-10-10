function pad(value) { return String(value).padStart(2, '0'); }

function dateString(input) {
  const date = input ? new Date(input) : new Date();
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function monthString(input) { return dateString(input).slice(0, 7); }

function money(value) {
  return Number(value || 0).toFixed(2);
}

function minutesText(value) {
  const minutes = Number(value || 0);
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return hours ? `${hours}小时${rest ? rest + '分钟' : ''}` : `${rest}分钟`;
}

function weekdayLabel(dateValue) {
  return ['日', '一', '二', '三', '四', '五', '六'][new Date(`${dateValue}T00:00:00`).getDay()];
}

module.exports = { dateString, monthString, money, minutesText, weekdayLabel };

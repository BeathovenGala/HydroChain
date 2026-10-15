const MAX_DATA_AGE_YEARS = 5;
const MIN_PURITY = 95;
const EFFICIENCY_RANGE = [50, 100];
const MIN_KWH_PER_KG = 1;
const TIME_RE = /^([01]?\d|2[0-3]):[0-5]\d$/;

function toMinutes(value) {
  const s = String(value ?? "").trim();
  if (!TIME_RE.test(s)) return null;
  const [h, m] = s.split(":").map(Number);
  return h * 60 + m;
}

function checkDate(date, reasons) {
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return reasons.push("invalid date");
  const ageYears = (Date.now() - d.getTime()) / (365.25 * 24 * 3600 * 1000);
  if (ageYears > MAX_DATA_AGE_YEARS) reasons.push(`reading is ${Math.floor(ageYears)} years old`);
  if (ageYears < 0) reasons.push("reading is dated in the future");
}

function checkTime(label, value, reasons) {
  if (value !== undefined && !TIME_RE.test(String(value).trim())) reasons.push(`${label} "${value}" is not a valid time`);
}

// Flags IoT readings an auditor should look at closely; it never blocks a request.
export function detectAnomalies(type, metadata) {
  if (!metadata || typeof metadata !== "object") return ["missing IoT data"];
  const reasons = [];
  if (metadata.date !== undefined) checkDate(metadata.date, reasons);

  if (type === "ISSUE") {
    const { purity, electrolyzerEfficiency: eff, hydrogenProduced: kg, electricityConsumed: kwh } = metadata;
    if (purity < MIN_PURITY) reasons.push(`purity ${purity}% below ${MIN_PURITY}%`);
    if (eff < EFFICIENCY_RANGE[0] || eff > EFFICIENCY_RANGE[1]) reasons.push(`electrolyzer efficiency ${eff}% out of range`);
    if (kg > 0 && kwh / kg < MIN_KWH_PER_KG) reasons.push("electricity use too low for hydrogen produced");
  }
  if (type === "BUY") {
    checkTime("transfer start", metadata.transferStartTime, reasons);
    checkTime("transfer end", metadata.transferEndTime, reasons);
  }
  if (type === "RETIRE") {
    const [start, end] = String(metadata.timePeriod ?? "").split("-").map(toMinutes);
    if (metadata.timePeriod !== undefined && (start === null || end === null || start === end)) {
      reasons.push(`time period "${metadata.timePeriod}" is not a valid range`);
    }
  }
  return reasons;
}

// /api/sb-prices 응답을 public/sb-history.json에 누적 병합.
// 같은 dateISO는 새 값이 덮어씀 (가격 정정 대비).
// 정렬: dateISO 내림차순 (최신이 [0]).

const fs = require("fs");
const path = require("path");

const HISTORY_PATH = path.join(__dirname, "..", "public", "sb-history.json");
const NEW_PATH     = path.join(__dirname, "..", "new_sb.json");
const GRADES = ["VLSFO", "IFO380", "LSMGO"];

function loadJson(p, fallback) {
  try {
    return JSON.parse(fs.readFileSync(p, "utf-8"));
  } catch {
    return fallback;
  }
}

const oldHistory = loadJson(HISTORY_PATH, { ports: {}, updatedAt: null });
const newData    = loadJson(NEW_PATH, null);

if (!newData || !newData.ports) {
  console.error("ERROR: new_sb.json missing or invalid");
  process.exit(1);
}

const merged = { ports: {}, updatedAt: new Date().toISOString() };
const allPorts = new Set([
  ...Object.keys(oldHistory.ports || {}),
  ...Object.keys(newData.ports || {}),
]);

let totalDates = 0;
const summary = [];

for (const port of allPorts) {
  merged.ports[port] = { VLSFO: [], IFO380: [], LSMGO: [] };
  const portStat = { port, ...Object.fromEntries(GRADES.map(g => [g, 0])) };
  for (const grade of GRADES) {
    const map = new Map();
    (oldHistory.ports?.[port]?.[grade] || []).forEach(e => map.set(e.dateISO, e));
    (newData.ports?.[port]?.[grade]   || []).forEach(e => map.set(e.dateISO, e));
    const arr = [...map.values()]
      .filter(e => e && typeof e.price === "number" && e.dateISO)
      .sort((a, b) => b.dateISO.localeCompare(a.dateISO));
    merged.ports[port][grade] = arr;
    portStat[grade] = arr.length;
    totalDates += arr.length;
  }
  summary.push(portStat);
}

fs.writeFileSync(HISTORY_PATH, JSON.stringify(merged, null, 2));

console.log("Merged. Per-port date counts:");
console.table(summary);
console.log(`Total entries across all ports/grades: ${totalDates}`);
console.log(`File: ${HISTORY_PATH}`);

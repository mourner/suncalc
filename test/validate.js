// Validation harness: runs SunCalc against the vendored external-truth fixtures and reports
// per-field error distributions (mean / p50 / p90 / max). Run with `node test/validate.js`.

import * as SunCalc from '../index.js';
import fx from './fixtures.json' with {type: 'json'};

const DEG = 180 / Math.PI;
const byName = Object.fromEntries(fx.locations.map(l => [l.name, l]));

// --- angle helpers (degrees) ---
const wrap180 = d => ((d % 360) + 540) % 360 - 180; // shortest signed difference
function angularSep(az1, alt1, az2, alt2) { // on-sky angle between two (az,alt) directions
    const r = Math.PI / 180;
    const c = Math.sin(alt1 * r) * Math.sin(alt2 * r) +
        Math.cos(alt1 * r) * Math.cos(alt2 * r) * Math.cos((az1 - az2) * r);
    return Math.acos(Math.min(1, Math.max(-1, c))) * DEG;
}
// SunCalc azimuth (rad, from south, +west) -> degrees North-referenced clockwise (Horizons convention)
const azToNorthDeg = rad => (((rad * DEG) + 180) % 360 + 360) % 360;

// --- stats ---
function stats(errs) {
    if (!errs.length) return null;
    const s = [...errs].sort((a, b) => a - b);
    const q = p => s[Math.min(s.length - 1, Math.floor(p * s.length))];
    return {n: s.length, mean: errs.reduce((a, b) => a + b, 0) / s.length, p50: q(0.5), p90: q(0.9), max: s[s.length - 1]};
}
const collectors = {};
function record(field, err) { (collectors[field] ??= []).push(err); }

// --- USNO "HH:MM" on a given UTC date -> Date ---
function usnoTime(date, hhmm) {
    if (!hhmm) return null;
    return new Date(`${date}T${hhmm}:00Z`);
}
// Rise/set/transit are times-of-day; fold the difference into +/-12h so a whole-day label
// offset (e.g. SunCalc dating an event to the adjacent UTC day) isn't counted as a 24h error.
function minutesDiff(a, b) {
    let m = (a - b) / 60000;
    m = ((m % 1440) + 1440) % 1440;
    return Math.min(m, 1440 - m);
}
const phen = (arr, name) => arr?.find(p => p.phen === name)?.time;

// --- positions: getPosition (Sun), getMoonPosition (Moon), getMoonIllumination ---
for (const [name, bag] of Object.entries(fx.positions)) {
    const {lat, lng} = byName[name];
    for (const [iso, truth] of Object.entries(bag.sun)) {
        const p = SunCalc.getPosition(new Date(iso), lat, lng);
        const az = azToNorthDeg(p.azimuth), alt = p.altitude * DEG;
        record('sun.altitude', Math.abs(alt - truth.altitude));
        record('sun.azimuth', Math.abs(wrap180(az - truth.azimuth)));
        record('sun.angularSep', angularSep(az, alt, truth.azimuth, truth.altitude));
    }
    for (const [iso, truth] of Object.entries(bag.moon)) {
        const p = SunCalc.getMoonPosition(new Date(iso), lat, lng);
        const az = azToNorthDeg(p.azimuth), alt = p.altitude * DEG;
        record('moon.altitude', Math.abs(alt - truth.altitude));
        record('moon.azimuth', Math.abs(wrap180(az - truth.azimuth)));
        record('moon.angularSep', angularSep(az, alt, truth.azimuth, truth.altitude));
    }
}
for (const [iso, truth] of Object.entries(fx.moonGeo)) {
    const ill = SunCalc.getMoonIllumination(new Date(iso));
    const pos = SunCalc.getMoonPosition(new Date(iso), 0, 0); // distance is geocentric, location-independent
    record('moon.fraction', Math.abs(ill.fraction - truth.fraction));
    record('moon.distance_km', Math.abs(pos.distance - truth.distance));
}

// --- times: getTimes (Sun) and getMoonTimes (Moon) vs USNO ---
const sunMap = [['Rise', 'sunrise'], ['Set', 'sunset'], ['Upper Transit', 'solarNoon'],
    ['Begin Civil Twilight', 'dawn'], ['End Civil Twilight', 'dusk']];
for (const [name, days] of Object.entries(fx.times)) {
    const {lat, lng} = byName[name];
    for (const [date, t] of Object.entries(days)) {
        const st = SunCalc.getTimes(new Date(`${date}T12:00:00Z`), lat, lng);
        for (const [ph, field] of sunMap) {
            const truth = usnoTime(date, phen(t.sundata, ph));
            if (truth && st[field] && !isNaN(st[field])) record(`time.${field}`, minutesDiff(st[field], truth));
        }
        const mt = SunCalc.getMoonTimes(new Date(`${date}T00:00:00Z`), lat, lng, true);
        for (const [ph, field] of [['Rise', 'rise'], ['Set', 'set']]) {
            const truth = usnoTime(date, phen(t.moondata, ph));
            if (truth && mt[field] && !isNaN(mt[field])) record(`moontime.${field}`, minutesDiff(mt[field], truth));
        }
    }
}

// --- report ---
const fmt = (v, u) => v >= 100 ? v.toFixed(0) + u : v >= 1 ? v.toFixed(2) + u : v.toFixed(3) + u;
function table(title, fields, unit) {
    console.log(`\n${title}`);
    console.log('  field'.padEnd(22) + ['n', 'mean', 'p50', 'p90', 'max'].map(h => h.padStart(9)).join(''));
    for (const f of fields) {
        const s = stats(collectors[f]);
        if (!s) continue;
        console.log(`  ${  f.padEnd(20)  }${String(s.n).padStart(9)
        }${[s.mean, s.p50, s.p90, s.max].map(v => fmt(v, unit).padStart(9)).join('')}`);
    }
}

console.log(`SunCalc validation vs external truth (fixtures generated ${fx.generated})`);
table('Sun position (deg vs JPL Horizons, refracted)', ['sun.altitude', 'sun.azimuth', 'sun.angularSep'], '°');
table('Moon position (deg vs JPL Horizons, refracted)', ['moon.altitude', 'moon.azimuth', 'moon.angularSep'], '°');
table('Moon illumination fraction (vs JPL Horizons)', ['moon.fraction'], '');
table('Moon distance (km vs JPL Horizons, geocentric)', ['moon.distance_km'], 'km');
table('Sun times (minutes vs USNO)', sunMap.map(([, f]) => `time.${f}`), 'm');
table('Moon times (minutes vs USNO)', ['moontime.rise', 'moontime.set'], 'm');
console.log();

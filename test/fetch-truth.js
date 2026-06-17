/* eslint-disable no-await-in-loop -- sequential awaits are intentional here: retry/backoff loops and the bounded-concurrency pool worker. */
// One-off: pull external ground truth for the validation matrix into test/fixtures.json.
// Run with `node test/fetch-truth.js`. Network required.
//
// Truth sources:
//   - JPL Horizons (https://ssd.jpl.nasa.gov/api/horizons.api): topocentric apparent az/el
//     for Sun (AIRLESS — matches getPosition, which adds no refraction) and Moon (REFRACTED —
//     matches getMoonPosition, which adds refraction), plus geocentric Moon illuminated fraction
//     and distance (location-independent — matches the geocentric getMoonIllumination/distance).
//   - USNO (https://aa.usno.navy.mil/api/rstt/oneday): sunrise/sunset, civil dawn/dusk, solar
//     transit, moonrise/moonset/transit, and polar "all day / none" phenomena, to the minute.
//
// Horizons azimuth is North-referenced (0=N, clockwise); the harness converts to SunCalc's
// South-referenced convention. Nautical/astronomical twilight are not offered by the USNO API
// and are left to timeanddate spot-checks.

import {writeFileSync, readFileSync, existsSync, mkdirSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {dirname, join} from 'node:path';
import {createHash} from 'node:crypto';

// --- Validation matrix: the locations x days x sample-hours grid we sample into fixtures.json. ---
// Each day is run at every location: used as-is by getTimes/getMoonTimes (which find events within
// the day themselves, validated vs USNO), and sampled at each sampleHoursUTC instant by
// getPosition/getMoonPosition/getMoonIllumination (validated vs JPL Horizons at those instants).
// We only need interesting calendar days, not precise astronomical instants. UTC throughout.

// Most populated city per |latitude| band per hemisphere (78°N→−78°S), Kyiv pinned for continuity,
// Longyearbyen/McMurdo as extreme-polar picks, and gap-fillers (Ushuaia, Reykjavík, Lima).
// Russian cities excluded.
const locations = [
    {name: 'Longyearbyen', lat: 78.22334, lng: 15.64689},
    {name: 'Tromsø', lat: 69.6489, lng: 18.95508},
    {name: 'Reykjavík', lat: 64.13548, lng: -21.89541},
    {name: 'Stockholm', lat: 59.32938, lng: 18.06871},
    {name: 'Kyiv', lat: 50.45466, lng: 30.5238},
    {name: 'Istanbul', lat: 41.01384, lng: 28.94966},
    {name: 'Shanghai', lat: 31.22222, lng: 121.45806},
    {name: 'Bogotá', lat: 4.60971, lng: -74.08175},
    {name: 'Kinshasa', lat: -4.32758, lng: 15.31357},
    {name: 'Lima', lat: -12.04318, lng: -77.02824},
    {name: 'Buenos Aires', lat: -34.61315, lng: -58.37723},
    {name: 'Melbourne', lat: -37.814, lng: 144.96332},
    {name: 'Ushuaia', lat: -54.81084, lng: -68.31591},
    {name: 'McMurdo Station', lat: -77.846, lng: 166.676}
];

// Instants sampled per day for the position/illumination functions, spanning a range of altitudes.
const sampleHoursUTC = [0, 6, 12, 18];

const days = [
    {date: '2026-01-03', label: 'perihelion (Sun nearest); also full moon'},
    {date: '2026-01-10', label: 'moon last quarter'},
    {date: '2026-01-18', label: 'new moon'},
    {date: '2026-01-25', label: 'moon first quarter'},
    {date: '2026-03-20', label: 'March equinox'},
    {date: '2026-06-01', label: 'lunar apogee (moon farthest, ~406,369 km)'},
    {date: '2026-06-21', label: 'June solstice (max polar day/night contrast)'},
    {date: '2026-07-06', label: 'aphelion (Sun farthest)'},
    {date: '2026-09-23', label: 'September equinox'},
    {date: '2026-12-21', label: 'December solstice'},
    {date: '2026-12-24', label: 'lunar perigee / supermoon (moon nearest)'},
    {date: '1950-06-21', label: 'historical solstice (small dT, exercises dT model)'},
    {date: '2050-06-21', label: 'future solstice (large dT, exercises dT model)'}
];

const here = dirname(fileURLToPath(import.meta.url));

// On-disk response cache keyed by URL, so partial/flaky runs resume without re-hitting the API.
const cacheDir = join(here, '.cache');
mkdirSync(cacheDir, {recursive: true});
const cachePath = url => join(cacheDir, createHash('sha1').update(url).digest('hex'));
const cacheGet = url => existsSync(cachePath(url)) ? readFileSync(cachePath(url), 'utf8') : null;
const cacheSet = (url, body) => writeFileSync(cachePath(url), body);
const AU_KM = 149597870.7;
const HORIZONS = 'https://ssd.jpl.nasa.gov/api/horizons.api';
const USNO = 'https://aa.usno.navy.mil/api/rstt/oneday';

// The Horizons fetch uses a fixed step between the first and last sample hour, so the sample
// hours must be evenly spaced. Verify before relying on it.
const stepH = sampleHoursUTC[1] - sampleHoursUTC[0];
const evenlySpaced = sampleHoursUTC.every((h, i) => i === 0 || h - sampleHoursUTC[i - 1] === stepH);
if (!evenlySpaced || sampleHoursUTC[0] !== 0) {
    throw new Error(`fetch-truth assumes sampleHoursUTC start at 0 and are evenly spaced; got ${sampleHoursUTC}`);
}
const startHour = sampleHoursUTC[0];
const stopHour = sampleHoursUTC[sampleHoursUTC.length - 1];

const hh = h => String(h).padStart(2, '0');

// Build a Horizons query string mirroring the validated curl calls: literal quotes/commas,
// spaces encoded as %20. Values are pre-quoted by the caller.
function horizonsURL(params) {
    const qs = Object.entries(params).map(([k, v]) => `${k}=${String(v).replace(/ /g, '%20')}`).join('&');
    return `${HORIZONS}?${qs}`;
}

const sleep = ms => new Promise((r) => { setTimeout(r, ms); });

async function fetchText(url, tries = 8) {
    const cached = cacheGet(url);
    if (cached !== null) return cached;
    for (let attempt = 1; ; attempt++) {
        try {
            const res = await fetch(url);
            const text = await res.text();
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            if (/API ERROR|INPUT ERROR|cannot parse|No ephemeris/i.test(text)) {
                throw new Error(text.split('\n').find(l => /ERROR|cannot|No ephemeris/i.test(l)) || 'Horizons error');
            }
            cacheSet(url, text);
            return text;
        } catch (e) {
            if (attempt >= tries) throw e;
            await sleep(Math.min(8000, 800 * 2 ** (attempt - 1))); // exponential backoff for 503s
        }
    }
}

async function fetchJSON(url, tries = 8) {
    const cached = cacheGet(url);
    if (cached !== null) return JSON.parse(cached);
    for (let attempt = 1; ; attempt++) {
        try {
            const res = await fetch(url);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const body = await res.text();
            cacheSet(url, body);
            return JSON.parse(body);
        } catch (e) {
            if (attempt >= tries) throw e;
            await sleep(Math.min(8000, 800 * 2 ** (attempt - 1)));
        }
    }
}

// Return the CSV data rows (arrays of trimmed fields) between $$SOE and $$EOE.
function parseRows(text) {
    const start = text.indexOf('$$SOE');
    const end = text.indexOf('$$EOE');
    if (start < 0 || end < 0) throw new Error('no $$SOE/$$EOE block');
    return text.slice(start + 5, end).trim().split('\n')
        .map(line => line.split(',').map(s => s.trim()));
}

// Topocentric apparent az/el for one body at one location over one day's sample hours.
// QUANTITIES 4 -> columns: date, sunFlag, moonFlag, Azi(deg, N-ref), Elev(deg)
async function fetchTopo({body, lat, lng, date, refracted}) {
    const params = {
        format: 'text', COMMAND: `'${body}'`, OBJ_DATA: '\'NO\'', MAKE_EPHEM: '\'YES\'',
        EPHEM_TYPE: '\'OBSERVER\'', CENTER: '\'coord@399\'', SITE_COORD: `'${lng},${lat},0'`,
        START_TIME: `'${date} ${hh(startHour)}:00'`, STOP_TIME: `'${date} ${hh(stopHour)}:00'`,
        STEP_SIZE: `'${stepH} h'`, QUANTITIES: '\'4\'', ANG_FORMAT: '\'DEG\'', CSV_FORMAT: '\'YES\'',
        TIME_DIGITS: '\'SECONDS\''
    };
    if (refracted) params.APPARENT = '\'REFRACTED\'';
    const rows = parseRows(await fetchText(horizonsURL(params)));
    if (rows.length !== sampleHoursUTC.length) {
        throw new Error(`expected ${sampleHoursUTC.length} rows, got ${rows.length}`);
    }
    return rows.map((r, i) => ({
        hourUTC: sampleHoursUTC[i],
        azimuth: +r[3], // degrees, North-referenced
        altitude: +r[4] // degrees
    }));
}

// Geocentric Moon illuminated fraction (%) and distance (AU) over one day's sample hours.
// QUANTITIES 10,20 -> columns: date, f, f, Illu%, delta(AU), deldot
async function fetchMoonGeo(date) {
    const params = {
        format: 'text', COMMAND: '\'301\'', OBJ_DATA: '\'NO\'', MAKE_EPHEM: '\'YES\'',
        EPHEM_TYPE: '\'OBSERVER\'', CENTER: '\'500@399\'',
        START_TIME: `'${date} ${hh(startHour)}:00'`, STOP_TIME: `'${date} ${hh(stopHour)}:00'`,
        STEP_SIZE: `'${stepH} h'`, QUANTITIES: '\'10,20\'', ANG_FORMAT: '\'DEG\'', CSV_FORMAT: '\'YES\'',
        TIME_DIGITS: '\'SECONDS\''
    };
    const rows = parseRows(await fetchText(horizonsURL(params)));
    return rows.map((r, i) => ({
        hourUTC: sampleHoursUTC[i],
        fraction: +r[3] / 100,
        distance: +r[4] * AU_KM // km, geocentric
    }));
}

async function fetchUSNO(lat, lng, date) {
    const url = `${USNO}?date=${date}&coords=${lat},${lng}&tz=0`;
    const data = (await fetchJSON(url)).properties.data;
    return {sundata: data.sundata, moondata: data.moondata, fracillum: data.fracillum};
}

// Run async tasks with bounded concurrency, logging progress.
async function pool(tasks, limit, label) {
    const results = new Array(tasks.length);
    let next = 0, done = 0;
    async function worker() {
        while (next < tasks.length) {
            const i = next++;
            results[i] = await tasks[i]();
            done++;
            if (done % 25 === 0 || done === tasks.length) {
                process.stdout.write(`\r  ${label}: ${done}/${tasks.length}   `);
            }
        }
    }
    await Promise.all(Array.from({length: limit}, worker));
    process.stdout.write('\n');
    return results;
}

const isoOf = (date, hourUTC) => `${date}T${hh(hourUTC)}:00:00Z`;

console.log(`Fetching truth: ${locations.length} locations x ${days.length} days x ${sampleHoursUTC.length} hours`);

// 1) Global geocentric Moon (illumination + distance), one call per day.
console.log('JPL Horizons - geocentric Moon (illumination + distance)');
const moonGeoByDay = {};
const geoResults = await pool(days.map(d => () => fetchMoonGeo(d.date)), 2, 'moon-geo');
days.forEach((d, i) => { moonGeoByDay[d.date] = geoResults[i]; });

// 2) Per-location topocentric Sun (airless) and Moon (refracted), one call per body per day.
console.log('JPL Horizons - topocentric Sun & Moon');
const topoJobs = [];
for (const loc of locations) for (const d of days) {
    topoJobs.push({loc, date: d.date, body: 'sun'});
    topoJobs.push({loc, date: d.date, body: 'moon'});
}
const topoResults = await pool(topoJobs.map(j => () => fetchTopo({
    body: j.body === 'sun' ? '10' : '301',
    lat: j.loc.lat, lng: j.loc.lng, date: j.date,
    refracted: j.body === 'moon'
})), 2, 'topo');

// 3) Per-location USNO rise/set/twilight, one call per day.
console.log('USNO - rise/set/twilight');
const usnoJobs = [];
for (const loc of locations) for (const d of days) usnoJobs.push({loc, date: d.date});
const usnoResults = await pool(usnoJobs.map(j => () => fetchUSNO(j.loc.lat, j.loc.lng, j.date)), 4, 'usno');

// Assemble fixtures.
const positions = {};
for (const loc of locations) positions[loc.name] = {sun: {}, moon: {}};
topoJobs.forEach((j, i) => {
    const rows = topoResults[i];
    const bag = positions[j.loc.name][j.body];
    for (const row of rows) bag[isoOf(j.date, row.hourUTC)] = {azimuth: row.azimuth, altitude: row.altitude};
});

const moonGeo = {};
for (const d of days) for (const row of moonGeoByDay[d.date]) {
    moonGeo[isoOf(d.date, row.hourUTC)] = {fraction: row.fraction, distance: row.distance};
}

const times = {};
for (const loc of locations) times[loc.name] = {};
usnoJobs.forEach((j, i) => { times[j.loc.name][j.date] = usnoResults[i]; });

const fixtures = {
    generated: new Date().toISOString(),
    about: {
        positions: 'JPL Horizons topocentric apparent. sun=AIRLESS (no refraction), moon=REFRACTED. azimuth deg North-referenced clockwise; altitude deg.',
        moonGeo: 'JPL Horizons geocentric: fraction 0-1, distance km.',
        times: 'USNO oneday (tz=0/UTC). sundata/moondata phen times "HH:MM"; civil twilight only.'
    },
    sampleHoursUTC,
    locations,
    days,
    positions,
    moonGeo,
    times
};

const out = join(here, 'fixtures.json');
writeFileSync(out, JSON.stringify(fixtures, null, 1));
console.log(`\nWrote ${out}`);

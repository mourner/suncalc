// Validation reporter: runs SunCalc against the vendored external-truth fixtures and prints
// per-field error distributions (mean / p50 / p90 / max). Manual run: `node test/validate.js`.
// This is the verbose meter; the pass/fail gate lives in accuracy.test.js. Both share compare.js.

import * as SunCalc from '../index.js';
import fx from './fixtures.json' with {type: 'json'};
import {measure, stats, sunMap} from './compare.js';

const collectors = measure(SunCalc, fx);

const fmt = (v, u) => v >= 100 ? v.toFixed(0) + u : v >= 1 ? v.toFixed(2) + u : v.toFixed(3) + u;
function table(title, fields, unit, scale = 1) {
    console.log(`\n${title}`);
    console.log('  field'.padEnd(22) + ['n', 'mean', 'p50', 'p90', 'max'].map(h => h.padStart(9)).join(''));
    for (const f of fields) {
        const s = stats(collectors[f]);
        if (!s) continue;
        console.log(`  ${  f.padEnd(20)  }${String(s.n).padStart(9)
        }${[s.mean, s.p50, s.p90, s.max].map(v => fmt(v * scale, unit).padStart(9)).join('')}`);
    }
}

console.log(`SunCalc validation vs external truth (fixtures generated ${fx.generated})`);
table('Sun position (deg vs JPL Horizons, refracted)', ['sun.altitude', 'sun.azimuth', 'sun.angularSep'], '°');
table('Sun times (seconds vs USNO)', sunMap.map(([, f]) => `time.${f}`), 's', 60);
table('Moon position (deg vs JPL Horizons, refracted)', ['moon.altitude', 'moon.azimuth', 'moon.angularSep'], '°');
table('Moon illumination fraction (vs JPL Horizons)', ['moon.fraction'], '');
table('Moon distance (km vs JPL Horizons, geocentric)', ['moon.distance_km'], 'km');
table('Moon times (seconds vs USNO)', ['moontime.rise', 'moontime.set'], 's', 60);
console.log();

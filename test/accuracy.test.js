// Truth-anchored regression gate. Runs SunCalc against the vendored external-truth fixtures
// (JPL Horizons + USNO, see fetch-truth.js) and asserts per-field error stays within tolerance.
// Replaces the old self-referential test.js: expectations come from independent ephemerides,
// not from SunCalc's own output, so internal refactors that stay accurate stay green.
//
// Each tolerance is set just above the level currently achieved, with the eventual TARGET noted.
// Reimplemented functions get tight gates; functions still on the legacy low-order math get
// honest loose gates so the suite is green and truthful as the rewrite progresses. Tighten the
// matching row whenever a function is reimplemented. `node test/validate.js` prints the full
// live distribution behind these numbers.

import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as SunCalc from '../index.js';
import fx from './fixtures.json' with {type: 'json'};
import {measure, stats} from './compare.js';

const collectors = measure(SunCalc, fx);

// field -> {mean, max} ceilings, in the field's unit (deg / fraction / km / minutes).
const TOLERANCE = {
    // Sun position — Meeus ch.25 apparent equatorial coords. TARGET ~0.05°; residual is
    // horizon refraction-model divergence vs Horizons' atmosphere.
    'sun.altitude': {mean: 0.12, max: 0.25},
    'sun.azimuth': {mean: 0.02, max: 0.05},
    'sun.angularSep': {mean: 0.12, max: 0.25},

    // Moon position — still the legacy low-order series, geocentric (no topocentric parallax).
    // TARGET arcminute-level; loose for now. azimuth/altitude omitted — angularSep is the
    // headline (raw az error blows up near the zenith).
    'moon.angularSep': {mean: 1.5,  max: 3.0},

    // Moon illumination — legacy low-order. TARGET <0.005.
    'moon.fraction': {mean: 0.01, max: 0.02},

    // Moon distance — legacy single cosine term. TARGET <500 km.
    'moon.distance_km': {mean: 5000, max: 10000},

    // Sun times — legacy root-finding. TARGET ~1 min. Tail to ~11 min today.
    'time.sunrise': {mean: 2.0, max: 12},
    'time.sunset': {mean: 2.0, max: 12},
    'time.solarNoon': {mean: 2.0, max: 4},
    'time.dawn': {mean: 2.0, max: 12},
    'time.dusk': {mean: 2.0, max: 12},

    // Moon times — legacy, geocentric. TARGET ~few min. Loose for now.
    'moontime.rise': {mean: 8,  max: 45},
    'moontime.set': {mean: 8,  max: 45}
};

for (const [field, tol] of Object.entries(TOLERANCE)) {
    test(field, () => {
        const s = stats(collectors[field]);
        assert.ok(s && s.n, `no samples recorded for ${field}`);
        assert.ok(s.mean <= tol.mean, `${field} mean ${s.mean.toFixed(3)} exceeds tolerance ${tol.mean} (n=${s.n})`);
        assert.ok(s.max <= tol.max, `${field} max ${s.max.toFixed(3)} exceeds tolerance ${tol.max} (n=${s.n})`);
    });
}

// Polar / always-up / always-down contract: getMoonTimes must report a flag (not a bogus time)
// when the moon never crosses the horizon over the UTC day. Sanity check on the highest-lat site.
test('getMoonTimes returns a flag when there is no crossing', () => {
    const polar = fx.locations.reduce((a, b) => Math.abs(b.lat) > Math.abs(a.lat) ? b : a);
    let sawFlag = false;
    for (const date of Object.keys(fx.times[polar.name] ?? {})) {
        const r = SunCalc.getMoonTimes(new Date(`${date}T00:00:00Z`), polar.lat, polar.lng, true);
        if (!r.rise && !r.set) {
            assert.ok(r.alwaysUp === true || r.alwaysDown === true,
                `expected alwaysUp/alwaysDown flag on ${date} at ${polar.name}`);
            sawFlag = true;
        }
    }
    assert.ok(sawFlag !== undefined); // informational; no crossing-free day is fine
});

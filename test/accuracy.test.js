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

    // Sun times — Meeus ch.15 hour-angle solver on the apparent sunCoords. Sub-0.3-min mean,
    // sub-min max. The harness matches each USNO event to the SunCalc event nearest in absolute
    // time (date+/-1), so SunCalc's solar-noon centring no longer surfaces as a polar day-label
    // artifact (see compare.js nearestTimeDiff).
    'time.sunrise': {mean: 0.4, max: 0.8},
    'time.sunset': {mean: 0.4, max: 0.8},
    'time.solarNoon': {mean: 0.4, max: 0.8},
    'time.dawn': {mean: 0.4, max: 0.8},
    'time.dusk': {mean: 0.4, max: 0.8},

    // Moon position — Meeus ch.47 series + topocentric parallax (ch.40). Residual matches the
    // Sun: horizon refraction-model divergence vs Horizons' atmosphere. azimuth/altitude omitted —
    // angularSep is the headline (raw az error blows up near the zenith).
    'moon.angularSep': {mean: 0.12,  max: 0.25},

    // Moon illumination — Meeus ch.47/48, now essentially exact. TARGET <0.005.
    'moon.fraction': {mean: 0.002, max: 0.005},

    // Moon distance — full ch.47 distance series. TARGET <500 km.
    'moon.distance_km': {mean: 100, max: 100},

    // Moon times — ch.47 series + topocentric parallax feed the quadratic sampler, then a Newton
    // polish against moonHeight (centre altitude + distance-varying semidiameter + horizon refraction)
    // removes the parabola-root interpolation error. Mean ~0.26 min, max <1 min; the floor is USNO's
    // whole-minute rounding.
    'moontime.rise': {mean: 0.4,  max: 0.9},
    'moontime.set': {mean: 0.4,  max: 0.9}
};

for (const [field, tol] of Object.entries(TOLERANCE)) {
    test(field, () => {
        const s = stats(collectors[field]);
        assert.ok(s && s.n, `no samples recorded for ${field}`);
        assert.ok(s.mean <= tol.mean, `${field} mean ${s.mean.toFixed(3)} exceeds tolerance ${tol.mean} (n=${s.n})`);
        assert.ok(s.max <= tol.max, `${field} max ${s.max.toFixed(3)} exceeds tolerance ${tol.max} (n=${s.n})`);
    });
}

// No silently-dropped samples: compare.js records a `missing.*` entry whenever external truth has an
// event but SunCalc returns no usable time. Any such entry is a regression (a dropped comparison that
// would otherwise lower the count without failing a tolerance), so the suite must see zero of them.
test('no dropped samples (every truth event has a SunCalc time)', () => {
    const dropped = Object.keys(collectors).filter(k => k.startsWith('missing.'));
    assert.deepEqual(dropped, [],
        `SunCalc produced no time where truth has an event: ${dropped.map(k => `${k.slice(8)} x${collectors[k].length}`).join(', ')}`);
});

// Polar absence contract (R2): when an event genuinely doesn't occur, getTimes/getMoonTimes must
// return null / a flag — never an Invalid Date — and set exactly one of alwaysUp/alwaysDown.
test('getTimes flags polar day/night instead of returning Invalid Date', () => {
    let sawPolar = false;
    for (const loc of fx.locations) {
        for (const date of Object.keys(fx.times[loc.name] ?? {})) {
            const r = SunCalc.getTimes(new Date(`${date}T12:00:00Z`), loc.lat, loc.lng);
            for (const [, rise, set] of SunCalc.times) {
                for (const f of [rise, set]) {
                    assert.ok(!(r[f] instanceof Date && isNaN(r[f])), `${f} is Invalid Date at ${loc.name} ${date}`);
                    assert.ok(r[f] === null || r[f] === undefined || !isNaN(r[f]), `${f} unusable at ${loc.name} ${date}`);
                }
            }
            if (r.sunrise === null) {
                sawPolar = true;
                assert.equal(r.alwaysUp === true ? 1 : 0, r.alwaysDown === true ? 0 : 1,
                    `expected exactly one of alwaysUp/alwaysDown at ${loc.name} ${date}`);
            } else {
                assert.equal(r.alwaysUp, undefined, `alwaysUp set on a normal day at ${loc.name} ${date}`);
                assert.equal(r.alwaysDown, undefined, `alwaysDown set on a normal day at ${loc.name} ${date}`);
            }
        }
    }
    assert.ok(sawPolar, 'fixture matrix should include at least one polar day/night case');
});

test('getMoonTimes flags no-crossing days instead of returning a bogus time', () => {
    const polar = fx.locations.reduce((a, b) => Math.abs(b.lat) > Math.abs(a.lat) ? b : a);
    for (const date of Object.keys(fx.times[polar.name] ?? {})) {
        const r = SunCalc.getMoonTimes(new Date(`${date}T00:00:00Z`), polar.lat, polar.lng);
        if (r.rise === undefined && r.set === undefined) {
            assert.ok(r.alwaysUp === true || r.alwaysDown === true,
                `expected alwaysUp/alwaysDown flag on ${date} at ${polar.name}`);
        } else {
            assert.ok(!(r.rise instanceof Date && isNaN(r.rise)), `rise Invalid Date ${date}`);
            assert.ok(!(r.set instanceof Date && isNaN(r.set)), `set Invalid Date ${date}`);
        }
    }
});

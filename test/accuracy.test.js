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
import moonPhases from './moon-phases.json' with {type: 'json'};
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
    'moontime.set': {mean: 0.4,  max: 0.9},

    // Moon transits — hour angle solved to zero (upper) or 180° (lower) against the ch.47 series.
    'moontime.transit': {mean: 0.4,  max: 0.9},
    'moontime.lowerTransit': {mean: 0.4,  max: 0.9}
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
        const r = SunCalc.getMoonTimes(new Date(`${date}T00:00:00Z`), polar.lat, polar.lng, 0);
        if (r.rise === undefined && r.set === undefined) {
            assert.ok(r.alwaysUp === true || r.alwaysDown === true,
                `expected alwaysUp/alwaysDown flag on ${date} at ${polar.name}`);
        } else {
            assert.ok(!(r.rise instanceof Date && isNaN(r.rise)), `rise Invalid Date ${date}`);
            assert.ok(!(r.set instanceof Date && isNaN(r.set)), `set Invalid Date ${date}`);
        }
    }
});

// regression for #186: on a no-crossing day the alwaysUp/alwaysDown direction must agree with the
// library's own position model, not with an extrapolated parabola extremum that can flip sign.
test('getMoonTimes no-crossing flag matches the actual altitude sign (issue #186)', () => {
    const lat = 78, lng = 78;
    for (const date of ['2022-01-14', '2022-01-15', '2022-01-16']) {
        const r = SunCalc.getMoonTimes(new Date(`${date}T12:00:00Z`), lat, lng, 0);
        assert.equal(r.rise, undefined, `unexpected rise on ${date}`);
        assert.equal(r.set, undefined, `unexpected set on ${date}`);

        const dayStart = new Date(`${date}T00:00:00Z`).valueOf();
        let max = -Infinity, min = Infinity;
        for (let h = 0; h <= 24; h += 0.5) {
            const {altitude} = SunCalc.getMoonPosition(new Date(dayStart + h * 3600e3), lat, lng);
            max = Math.max(max, altitude);
            min = Math.min(min, altitude);
        }
        assert.ok(min > 0, `${date}: moon dips below horizon, fixture assumption wrong`);
        assert.equal(r.alwaysUp, true, `${date}: moon stays up (${min.toFixed(1)}..${max.toFixed(1)}°) but not alwaysUp`);
        assert.equal(r.alwaysDown, false, `${date}: moon stays up but flagged alwaysDown`);
    }
});

// regression for #187: getTimes must anchor to the local solar day containing the input instant.
// Rounding to the nearest UTC noon first put antimeridian longitudes a full day off whenever the
// input landed within minutes of that UTC boundary — the local solar day is ~12 h out of phase there.
test('getTimes resolves the anchored solar day at every longitude (issue #187)', () => {
    const day = Date.UTC(2026, 7, 19, 12), lat = 40, hourMs = 3600e3;
    for (const lng of [-180, -179.9, -179.7, -179.676, -179.6, -90, 0, 90, 179.9, 180]) {
        const anchor = new Date(day - (lng / 15) * hourMs); // that longitude's own local solar noon
        const off = (SunCalc.getTimes(anchor, lat, lng).solarNoon - anchor) / hourMs;
        assert.ok(Math.abs(off) < 1, `lng ${lng}: solarNoon ${off.toFixed(2)} h from local solar noon`);
    }
});

// regression for #189: getMoonTimes must scan the same day getTimes resolves (the local solar day
// containing the instant), not the UTC day, which missed Boston's 20:23 EDT moonrise on Sep 30.
test('getMoonTimes scans the local solar day getTimes resolves (issue #189)', () => {
    const r = SunCalc.getMoonTimes(new Date('2026-09-30T16:00:00Z'), 42.764767, -71.042023);
    assert.ok(r.rise && Math.abs(r.rise - Date.UTC(2026, 9, 1, 0, 23)) < 60e3, `rise ${r.rise?.toISOString()}`);

    const day = Date.UTC(2026, 8, 30, 12), lat = 40, hourMs = 3600e3;
    for (const lng of [-180, -179.7, -90, -71, 0, 90, 179.9, 180]) {
        for (const h of [-6, 0, 6]) {
            const date = new Date(day - (lng / 15 - h) * hourMs);
            const {nadir} = SunCalc.getTimes(date, lat, lng);
            const m = SunCalc.getMoonTimes(date, lat, lng);
            for (const t of [m.rise, m.set, m.transit, m.lowerTransit]) {
                if (t) assert.ok(t >= nadir - 60e3 && t < nadir.valueOf() + 24 * hourMs + 60e3,
                    `lng ${lng} h ${h}: ${t.toISOString()} outside the solar day from ${nadir.toISOString()}`);
            }
        }
    }
});

// with the observer's UTC offset, both functions resolve the civil day containing the instant
// regardless of its time-of-day, fixing the local-midnight flips of #149 and #174.
test('utcOffset anchors getTimes and getMoonTimes to the civil day', () => {
    const cases = [
        // [civil date, lat, lng, utcOffset in minutes]
        ['2020-10-09', 56, 35, 180], // #149
        ['2022-04-14', -14.415, 128.525, 480], // #174
        ['2026-09-30', 42.764767, -71.042023, -240], // #189
        ['2026-08-19', 40, -179.7, -720],
        ['2026-08-19', 40, 179.7, 720],
        ['2026-08-19', 27.7, 85.3, 345]
    ];
    for (const [date, lat, lng, off] of cases) {
        const start = Date.parse(`${date}T00:00:00Z`) - off * 60e3, end = start + 86400e3;
        for (const ms of [start, start + 43200e3, end - 60e3]) {
            const t = SunCalc.getTimes(new Date(ms), lat, lng, 0, off);
            assert.ok(t.solarNoon >= start && t.solarNoon < end, `${date} ${lng}: solarNoon ${t.solarNoon.toISOString()}`);

            const m = SunCalc.getMoonTimes(new Date(ms), lat, lng, off);
            for (const e of [m.rise, m.set, m.transit, m.lowerTransit]) {
                if (e) assert.ok(e >= start && e < end, `${date} ${lng}: moon event ${e.toISOString()}`);
            }
        }
    }
    const m = SunCalc.getMoonTimes(new Date('2026-09-30T00:00:00-04:00'), 42.764767, -71.042023, -240);
    assert.ok(m.rise && m.set, 'reporter input with offset gets both rise and set');
});

// consecutive daily windows must report every meridian crossing exactly once: transits ~24.8 h apart,
// so each kind skips about one day a month, and they're reported even when the moon stays down
test('getMoonTimes reports each moon transit exactly once across consecutive days', () => {
    for (const [lat, lng, off] of [[51.5, -0.1, 0], [-33.9, 151.2, 600], [40, -179.7, -720], [78.2, 15.6, 60]]) {
        for (const field of ['transit', 'lowerTransit']) {
            let prev, skipped = 0;
            for (let i = 0; i < 60; i++) {
                const m = SunCalc.getMoonTimes(new Date(Date.UTC(2026, 0, 1 + i, 12)), lat, lng, off);
                if (!m[field]) { skipped++; continue; }
                if (prev) {
                    const gap = (m[field] - prev) / 3600e3;
                    assert.ok(gap > 24.2 && gap < 25.6, `${lat},${lng} ${field}: ${gap.toFixed(2)} h after previous`);
                }
                prev = m[field];
            }
            assert.ok(skipped === 2, `${lat},${lng} ${field}: ${skipped} days without one in 60`);
        }
    }
});

test('getMoonIllumination phase crosses the named values at the USNO phase instants (issue #190)', () => {
    let sum = 0, max = 0;
    for (const [iso, target] of moonPhases) {
        const t = Date.parse(iso);
        // bisect the instant phase passes target within ±12 h; signed offset wraps across 0/1
        const past = ms => (SunCalc.getMoonIllumination(new Date(ms)).phase - target + 1.5) % 1 - 0.5;
        let a = t - 12 * 3600e3, b = t + 12 * 3600e3;
        while (b - a > 1e3) {
            const m = (a + b) / 2;
            if (past(m) < 0) a = m; else b = m;
        }
        const err = Math.abs(b - t) / 60e3;
        sum += err;
        max = Math.max(max, err);
    }
    // USNO times are rounded to the minute, so ~0.5 min mean is the floor
    assert.ok(sum / moonPhases.length < 1, `mean ${(sum / moonPhases.length).toFixed(2)} min`);
    assert.ok(max < 2, `max ${max.toFixed(2)} min`);
});

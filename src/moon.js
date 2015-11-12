'use strict';

var pos = require('./pos');
var julian = require('./julian');
var sun = require('./sun');

exports.times = moonTimes;
exports.illumination = illumination;
exports.pos = moonPosition;

var rad = Math.PI / 180;
var sin = Math.sin;
var cos = Math.cos;

// moon calculations, based on http://aa.quae.nl/en/reken/hemelpositie.html formulas

function moonCoords(d) { // geocentric ecliptic coordinates of the moon

    var L = rad * (218.316 + 13.176396 * d), // ecliptic longitude
        M = rad * (134.963 + 13.064993 * d), // mean anomaly
        F = rad * (93.272 + 13.229350 * d),  // mean distance

        l  = L + rad * 6.289 * sin(M), // longitude
        b  = rad * 5.128 * sin(F);     // latitude

    var coords = pos.coords(l, b);
    coords.dist = 385001 - 20905 * cos(M); // distance to the moon in km

    return coords;
}

function moonPosition(date, lat, lng) {

    var lw  = rad * -lng,
        phi = rad * lat,
        d   = julian.to(date),

        c = moonCoords(d),
        H = pos.siderealTime(d, lw) - c.ra;

    var position = pos.pos(H, phi, c.dec);
    position.distance = c.dist;

    // altitude correction for refraction
    var h = position.altitude;
    position.altitude = h + rad * 0.017 / Math.tan(h + rad * 10.26 / (h + rad * 5.10));

    return position;
}


// calculations for illumination parameters of the moon,
// based on http://idlastro.gsfc.nasa.gov/ftp/pro/astro/mphase.pro formulas and
// Chapter 48 of "Astronomical Algorithms" 2nd edition by Jean Meeus (Willmann-Bell, Richmond) 1998.

function illumination(date) {

    var d = julian.to(date),
        s = sun.coords(d),
        m = moonCoords(d),

        sdist = 149598000, // distance from Earth to Sun in km

        phi = Math.acos(sin(s.dec) * sin(m.dec) + cos(s.dec) * cos(m.dec) * cos(s.ra - m.ra)),
        inc = Math.atan2(sdist * sin(phi), m.dist - sdist * cos(phi)),
        angle = Math.atan2(cos(s.dec) * sin(s.ra - m.ra), sin(s.dec) * cos(m.dec) -
                cos(s.dec) * sin(m.dec) * cos(s.ra - m.ra));

    return {
        fraction: (1 + cos(inc)) / 2,
        phase: 0.5 + 0.5 * inc * (angle < 0 ? -1 : 1) / Math.PI,
        angle: angle
    };
}

// calculations for moon rise/set times are based on http://www.stargazing.net/kepler/moonrise.html article

function hoursLater(date, h) {
    return new Date(date.valueOf() + h * 1000 * 60 * 60);
}

function moonTimes(date, lat, lng, inUTC) {
    var t = new Date(date);
    if (inUTC) t.setUTCHours(0, 0, 0, 0);
    else t.setHours(0, 0, 0, 0);

    var hc = 0.133 * rad,
        h0 = moonPosition(t, lat, lng).altitude - hc,
        h1, h2, rise, set, a, b, xe, ye, d, roots, x1, x2, dx;

    // go in 2-hour chunks, each time seeing if a 3-point quadratic curve crosses zero (which means rise or set)
    for (var i = 1; i <= 24; i += 2) {
        h1 = moonPosition(hoursLater(t, i), lat, lng).altitude - hc;
        h2 = moonPosition(hoursLater(t, i + 1), lat, lng).altitude - hc;

        a = (h0 + h2) / 2 - h1;
        b = (h2 - h0) / 2;
        xe = -b / (2 * a);
        ye = (a * xe + b) * xe + h1;
        d = b * b - 4 * a * h1;
        roots = 0;

        if (d >= 0) {
            dx = Math.sqrt(d) / (Math.abs(a) * 2);
            x1 = xe - dx;
            x2 = xe + dx;
            if (Math.abs(x1) <= 1) roots++;
            if (Math.abs(x2) <= 1) roots++;
            if (x1 < -1) x1 = x2;
        }

        if (roots === 1) {
            if (h0 < 0) rise = i + x1;
            else set = i + x1;

        } else if (roots === 2) {
            rise = i + (ye < 0 ? x2 : x1);
            set = i + (ye < 0 ? x1 : x2);
        }

        if (rise && set) break;

        h0 = h2;
    }

    var result = {};

    if (rise) result.rise = hoursLater(t, rise);
    if (set) result.set = hoursLater(t, set);

    if (!rise && !set) result[ye > 0 ? 'alwaysUp' : 'alwaysDown'] = true;

    return result;
}

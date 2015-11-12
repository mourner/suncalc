'use strict';

var pos = require('./pos');
var julian = require('./julian');

exports.pos = getSunPosition;
exports.times = getSunTimes;
exports.addTime = addSunTime;
exports.coords = sunCoords;

var sin  = Math.sin,
    cos  = Math.cos,
    acos = Math.acos,
    rad  = Math.PI / 180;

// general sun calculations

function solarMeanAnomaly(d) {
    return rad * (357.5291 + 0.98560028 * d);
}

function eclipticLongitude(M) {

    var C = rad * (1.9148 * sin(M) + 0.02 * sin(2 * M) + 0.0003 * sin(3 * M)), // equation of center
        P = rad * 102.9372; // perihelion of the Earth

    return M + C + P + Math.PI;
}

function sunCoords(d) {
    return pos.coords(eclipticLongitude(solarMeanAnomaly(d)), 0);
}


// calculates sun position for a given date and latitude/longitude

function getSunPosition(date, lat, lng) {

    var lw  = rad * -lng,
        phi = rad * lat,
        d   = julian.to(date),

        c  = sunCoords(d),
        H  = pos.siderealTime(d, lw) - c.ra;

    return pos.pos(H, phi, c.dec);
}


// sun times configuration (angle, morning name, evening name)

var times = exports.table = [
    [-0.833, 'sunrise',       'sunset'      ],
    [  -0.3, 'sunriseEnd',    'sunsetStart' ],
    [    -6, 'dawn',          'dusk'        ],
    [   -12, 'nauticalDawn',  'nauticalDusk'],
    [   -18, 'nightEnd',      'night'       ],
    [     6, 'goldenHourEnd', 'goldenHour'  ]
];

// adds a custom time to the times config

function addSunTime(angle, riseName, setName) {
    times.push([angle, riseName, setName]);
}


// calculations for sun times

var J0 = 0.0009;

function julianCycle(d, lw) {
    return Math.round(d - J0 - lw / (2 * Math.PI));
}
function approxTransit(Ht, lw, n) {
    return J0 + (Ht + lw) / (2 * Math.PI) + n;
}
function solarTransitJ(ds, M, L) {
    return ds + 0.0053 * sin(M) - 0.0069 * sin(2 * L);
}
function hourAngle(h, phi, d) {
    return acos((sin(h) - sin(phi) * sin(d)) / (cos(phi) * cos(d)));
}

// returns set time for the given sun altitude
function getSetJ(h, lw, phi, dec, n, M, L) {

    var w = hourAngle(h, phi, dec),
        a = approxTransit(w, lw, n);
    return solarTransitJ(a, M, L);
}


// calculates sun times for a given date and latitude/longitude

function getSunTimes(date, lat, lng) {

    var lw = rad * -lng,
        phi = rad * lat,

        d = julian.to(date),
        n = julianCycle(d, lw),
        ds = approxTransit(0, lw, n),

        M = solarMeanAnomaly(ds),
        L = eclipticLongitude(M),
        dec = pos.declination(L, 0),

        Jnoon = solarTransitJ(ds, M, L),

        i, len, time, Jset, Jrise;


    var result = {
        solarNoon: julian.from(Jnoon),
        nadir: julian.from(Jnoon - 0.5)
    };

    for (i = 0, len = times.length; i < len; i += 1) {
        time = times[i];

        Jset = getSetJ(time[0] * rad, lw, phi, dec, n, M, L);
        Jrise = Jnoon - (Jset - Jnoon);

        result[time[1]] = julian.from(Jrise);
        result[time[2]] = julian.from(Jset);
    }

    return result;
}

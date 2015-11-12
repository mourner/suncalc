'use strict';

// general calculations for position

var e = 23.4397 * Math.PI / 180; // obliquity of the Earth
var cosE = Math.cos(e);
var sinE = Math.sin(e);

exports.declination = dec;

exports.coords = function (l, b) {
    return {
        ra: ra(l, b),
        dec: dec(l, b)
    };
};

exports.pos = function (H, phi, dec) {
    return {
        azimuth: azimuth(H, phi, dec),
        altitude: altitude(H, phi, dec)
    };
};

exports.siderealTime = function (d, lw) {
    return (280.16 + 360.9856235 * d) * Math.PI / 180 - lw;
};

function ra(l, b) {
    return Math.atan2(Math.sin(l) * cosE - Math.tan(b) * sinE, Math.cos(l));
}
function dec(l, b) {
    return Math.asin(Math.sin(b) * cosE + Math.cos(b) * sinE * Math.sin(l));
}

function azimuth(H, phi, dec) {
    return Math.atan2(Math.sin(H), Math.cos(H) * Math.sin(phi) - Math.tan(dec) * Math.cos(phi));
}
function altitude(H, phi, dec) {
    return Math.asin(Math.sin(phi) * Math.sin(dec) + Math.cos(phi) * Math.cos(dec) * Math.cos(H));
}

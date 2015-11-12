'use strict';

// general calculations for position

var e = 23.4397 * Math.PI / 180; // obliquity of the Earth
var cosE = Math.cos(e);
var sinE = Math.sin(e);

exports.rightAscension = function (l, b) {
    return Math.atan2(Math.sin(l) * cosE - Math.tan(b) * sinE, Math.cos(l));
};

exports.declination = function (l, b) {
    return Math.asin(Math.sin(b) * cosE + Math.cos(b) * sinE * Math.sin(l));
};

exports.azimuth = function (H, phi, dec) {
    return Math.atan2(Math.sin(H), Math.cos(H) * Math.sin(phi) - Math.tan(dec) * Math.cos(phi));
};

exports.altitude = function (H, phi, dec) {
    return Math.asin(Math.sin(phi) * Math.sin(dec) + Math.cos(phi) * Math.cos(dec) * Math.cos(H));
};

exports.siderealTime = function (d, lw) {
    return (280.16 + 360.9856235 * d) * Math.PI / 180 - lw;
};

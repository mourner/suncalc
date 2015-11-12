'use strict';

var moon = require('./moon');
var sun = require('./sun');

exports.getPosition = sun.pos;
exports.getTimes = sun.times;
exports.addTime = sun.addTime;
exports.times = sun.table;

exports.getMoonPosition = moon.pos;
exports.getMoonTimes = moon.times;
exports.getMoonIllumination = moon.illumination;

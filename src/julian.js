'use strict';

var DAY_MS = 1000 * 60 * 60 * 24; // ms per day
var J2000 = 10957; // number of julian days from 1970 to 2000

exports.from = function (j)  {
    var days = J2000 + j + 0.5;
    return new Date(days * DAY_MS);
};

exports.to = function (date) {
    return date / DAY_MS - 0.5 - J2000;
};


var old = require('./suncalc');
var meeus = require('./meeus');

var RAD = Math.PI / 180;

var date = new Date(); //'2016-01-01UTC'

console.log(meeus.getPosition(date, 50.5, 30.5).altitude / RAD);
console.log(old.getPosition(date, 50.5, 30.5).altitude / RAD);

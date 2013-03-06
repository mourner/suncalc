var sc = require('./suncalc'),
	assert = require('assert');

var date = new Date('2013-03-05UTC'),
	lat = 50.5,
	lng = 30.5;

assert.deepEqual(sc.getMoonPosition(date, lat, lng), {
	azimuth: -0.9783999522438226,
	altitude: 0.006969727754891917,
	distance: 364121.37256256194
});

assert.deepEqual(sc.getPosition(date, lat, lng), {
	azimuth: -2.5003175907168385,
	altitude: -0.7000406838781611
});

console.log(sc.getTimes(date, lat, lng));

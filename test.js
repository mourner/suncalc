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

var times = sc.getTimes(date, lat, lng);

assert.equal(times.solarNoon.toUTCString(), new Date("2013-03-05T10:10:57Z").toUTCString());
assert.equal(times.nadir.toUTCString(), new Date("2013-03-04T22:10:57Z").toUTCString());
assert.equal(times.sunrise.toUTCString(), new Date("2013-03-05T04:34:57Z").toUTCString());
assert.equal(times.sunset.toUTCString(), new Date("2013-03-05T15:46:56Z").toUTCString());
assert.equal(times.sunriseEnd.toUTCString(), new Date("2013-03-05T04:38:19Z").toUTCString());
assert.equal(times.sunsetStart.toUTCString(), new Date("2013-03-05T15:43:34Z").toUTCString());
assert.equal(times.dawn.toUTCString(), new Date("2013-03-05T04:02:17Z").toUTCString());
assert.equal(times.dusk.toUTCString(), new Date("2013-03-05T16:19:36Z").toUTCString());
assert.equal(times.nauticalDawn.toUTCString(), new Date("2013-03-05T03:24:31Z").toUTCString());
assert.equal(times.nauticalDusk.toUTCString(), new Date("2013-03-05T16:57:22Z").toUTCString());
assert.equal(times.nightEnd.toUTCString(), new Date("2013-03-05T02:46:17Z").toUTCString());
assert.equal(times.night.toUTCString(), new Date("2013-03-05T17:35:36Z").toUTCString());
assert.equal(times.goldenHourEnd.toUTCString(), new Date("2013-03-05T05:19:01Z").toUTCString());
assert.equal(times.goldenHour.toUTCString(), new Date("2013-03-05T15:02:52Z").toUTCString());

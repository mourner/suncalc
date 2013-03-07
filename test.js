
var SunCalc = require('./suncalc'),
	assert = require('assert');

var date = new Date('2013-03-05UTC'),
	lat = 50.5,
	lng = 30.5;


var sunPos = SunCalc.getPosition(date, lat, lng);

assert.equal(sunPos.azimuth, -2.5003175907168385);
assert.equal(sunPos.altitude, -0.7000406838781611);


var times = SunCalc.getTimes(date, lat, lng);

var testTimes = {
	solarNoon: "2013-03-05T10:10:57Z",
	nadir: "2013-03-04T22:10:57Z",
	sunrise: "2013-03-05T04:34:57Z",
	sunset: "2013-03-05T15:46:56Z",
	sunriseEnd: "2013-03-05T04:38:19Z",
	sunsetStart: "2013-03-05T15:43:34Z",
	dawn: "2013-03-05T04:02:17Z",
	dusk: "2013-03-05T16:19:36Z",
	nauticalDawn: "2013-03-05T03:24:31Z",
	nauticalDusk: "2013-03-05T16:57:22Z",
	nightEnd: "2013-03-05T02:46:17Z",
	night: "2013-03-05T17:35:36Z",
	goldenHourEnd: "2013-03-05T05:19:01Z",
	goldenHour: "2013-03-05T15:02:52Z"
};

for (var i in testTimes) {
	assert.equal(times[i].toUTCString(), new Date(testTimes[i]).toUTCString());
}


var moonPos = SunCalc.getMoonPosition(date, lat, lng);

assert.equal(moonPos.azimuth, -0.9783999522438226);
assert.equal(moonPos.altitude, 0.006969727754891917);
assert.equal(moonPos.distance, 364121.37256256194);

assert.equal(SunCalc.getMoonFraction(date, lat, lng), 0.4848068202456373);


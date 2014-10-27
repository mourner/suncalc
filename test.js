
var SunCalc = require('./suncalc'),
    t = require('tape');

function near(val1, val2, margin) {
    return Math.abs(val1 - val2) < (margin || 1E-15);
}

var date = new Date('2013-03-05UTC'),
    lat = 50.5,
    lng = 30.5;

var testTimes = {
    solarNoon: '2013-03-05T10:10:57Z',
    nadir: '2013-03-04T22:10:57Z',
    sunrise: '2013-03-05T04:34:56Z',
    sunset: '2013-03-05T15:46:57Z',
    sunriseEnd: '2013-03-05T04:38:19Z',
    sunsetStart: '2013-03-05T15:43:34Z',
    dawn: '2013-03-05T04:02:17Z',
    dusk: '2013-03-05T16:19:36Z',
    nauticalDawn: '2013-03-05T03:24:31Z',
    nauticalDusk: '2013-03-05T16:57:22Z',
    nightEnd: '2013-03-05T02:46:17Z',
    night: '2013-03-05T17:35:36Z',
    goldenHourEnd: '2013-03-05T05:19:01Z',
    goldenHour: '2013-03-05T15:02:52Z'
};

t.test('getPosition returns azimuth and altitude for the given time and location', function (t) {
    var sunPos = SunCalc.getPosition(date, lat, lng);

    t.ok(near(sunPos.azimuth, -2.5003175907168385), 'azimuth');
    t.ok(near(sunPos.altitude, -0.7000406838781611), 'altitude');
    t.end();
});

t.test('getTimes returns sun phases for the given date and location', function (t) {
    var times = SunCalc.getTimes(date, lat, lng);

    for (var i in testTimes) {
        t.equal(new Date(testTimes[i]).toUTCString(), times[i].toUTCString(), i);
    }
    t.end();
});

t.test('getMoonPosition returns moon position data given time and location', function (t) {
    var moonPos = SunCalc.getMoonPosition(date, lat, lng);

    t.ok(near(moonPos.azimuth, -0.9783999522438226), 'azimuth');
    t.ok(near(moonPos.altitude, 0.006969727754891917), 'altitude');
    t.ok(near(moonPos.distance, 364121.37256256194), 'distance');
    t.end();
});

t.test('getMoonIllumination returns fraction and angle of moon\'s illuminated limb and phase', function (t) {
    var moonIllum = SunCalc.getMoonIllumination(date);

    t.ok(near(moonIllum.fraction, 0.4848068202456373), 'fraction');
    t.ok(near(moonIllum.phase, 0.7548368838538762), 'phase');
    t.ok(near(moonIllum.angle, 1.6732942678578346), 'angle');
    t.end();
});

t.test('getMoonTimes returns moon rise and set times', function (t) {
    var moonTimes = SunCalc.getMoonTimes(date, lat, lng);

    t.equal(moonTimes.rise.toUTCString(), 'Mon, 04 Mar 2013 23:57:55 GMT');
    t.equal(moonTimes.set.toUTCString(), 'Tue, 05 Mar 2013 08:41:31 GMT');
    t.end();
});

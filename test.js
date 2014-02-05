
var SunCalc = require('./suncalc'),
    assert = require('assert');

function assertNear(val1, val2, margin) {
    margin = margin || 1E-15;
    assert.ok(Math.abs(val1 - val2) < margin, 'asserted almost equal: ' + val1 + ', ' + val2);
}

describe('SunCalc', function () {

    var date = new Date('2013-03-05UTC'),
        lat = 50.5,
        lng = 30.5;

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

    describe('getPosition', function () {
        it('should return an object with correct azimuth and altitude for the given time and location', function () {
            var sunPos = SunCalc.getPosition(date, lat, lng);

            assertNear(sunPos.azimuth, -2.5003175907168385);
            assertNear(sunPos.altitude, -0.7000406838781611);
        });
    });

    describe('getTimes', function () {
        it('should return correct sun phases for the given date and location', function () {
            var times = SunCalc.getTimes(date, lat, lng);

            for (var i in testTimes) {
                assert.equal(times[i].toUTCString(), new Date(testTimes[i]).toUTCString());
            }
        });
    });

    describe('getMoonPosition', function () {
        it('should return an object with correct moon position data given time and location', function () {
            var moonPos = SunCalc.getMoonPosition(date, lat, lng);

            assertNear(moonPos.azimuth, -0.9783999522438226);
            assertNear(moonPos.altitude, 0.006969727754891917);
            assertNear(moonPos.distance, 364121.37256256194);
        });
    });

    describe('getMoonIllumination', function () {
        it('should return an object with correct fraction and angle of moon\'s illuminated limb given time', function () {
            var moonIllum = SunCalc.getMoonIllumination(date);

            assertNear(moonIllum.fraction, 0.4848068202456373);
            assertNear(moonIllum.angle, 1.6732942678578346);
        });
    });
});

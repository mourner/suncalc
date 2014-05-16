
SunCalc
=======

SunCalc is a tiny BSD-licensed JavaScript library for calculating sun position,
sunlight phases (times for sunrise, sunset, dusk, etc.),
moon position and lunar phase for the given location and time,
created by [Vladimir Agafonkin](http://agafonkin.com/en) ([@mourner](https://github.com/mourner))
as a part of the [SunCalc.net project](http://suncalc.net).

Most calculations are based on the formulas given in the excellent Astronomy Answers articles
about [position of the sun](http://aa.quae.nl/en/reken/zonpositie.html)
and [the planets](http://aa.quae.nl/en/reken/hemelpositie.html).
You can read about different twilight phases calculated by SunCalc
in the [Twilight article on Wikipedia](http://en.wikipedia.org/wiki/Twilight).


## Usage example

```javascript
// get today's sunlight times for London
var times = SunCalc.getTimes(new Date(), 51.5, -0.1);

// format sunrise time from the Date object
var sunriseStr = times.sunrise.getHours() + ':' + times.sunrise.getMinutes();

// get position of the sun (azimuth and altitude) at today's sunrise
var sunrisePos = SunCalc.getPosition(times.sunrise, 51.5, -0.1);

// get sunrise azimuth in degrees
var sunriseAzimuth = sunrisePos.azimuth * 180 / Math.PI;
```

SunCalc is also available as an NPM package:

```bash
$ npm install suncalc
```

```js
var SunCalc = require('suncalc');
```


## Reference

### Sunlight times

```javascript
SunCalc.getTimes(/*Date*/ date, /*Number*/ latitude, /*Number*/ longitude)
```

Returns an object with the following properties (each is a `Date` object):

| Property        | Description                                                              |
| --------------- | ------------------------------------------------------------------------ |
| `sunrise`       | sunrise (top edge of the sun appears on the horizon)                     |
| `sunriseEnd`    | sunrise ends (bottom edge of the sun touches the horizon)                |
| `goldenHourEnd` | morning golden hour (soft light, best time for photography) ends         |
| `solarNoon`     | solar noon (sun is in the highest position)                              |
| `goldenHour`    | evening golden hour starts                                               |
| `sunsetStart`   | sunset starts (bottom edge of the sun touches the horizon)               |
| `sunset`        | sunset (sun disappears below the horizon, evening civil twilight starts) |
| `dusk`          | dusk (evening nautical twilight starts)                                  |
| `nauticalDusk`  | nautical dusk (evening astronomical twilight starts)                     |
| `night`         | night starts (dark enough for astronomical observations)                 |
| `nadir`         | nadir (darkest moment of the night, sun is in the lowest position)       |
| `nightEnd`      | night ends (morning astronomical twilight starts)                        |
| `nauticalDawn`  | nautical dawn (morning nautical twilight starts)                         |
| `dawn`          | dawn (morning nautical twilight ends, morning civil twilight starts)     |

```javascript
SunCalc.addTime(/*Number*/ angleInDegrees, /*String*/ morningName, /*String*/ eveningName)
```

Adds a custom time when the sun reaches the given angle to results returned by `SunCalc.getTimes`.

`SunCalc.times` property contains all currently defined times.


### Sun position

```javascript
SunCalc.getPosition(/*Date*/ timeAndDate, /*Number*/ latitude, /*Number*/ longitude)
```

Returns an object with the following properties:

 * `altitude`: sun altitude above the horizon in radians,
 e.g. `0` at the horizon and `PI/2` at the zenith (straight over your head)
 * `azimuth`: sun azimuth in radians (direction along the horizon, measured from south to west),
 e.g. `0` is south and `Math.PI * 3/4` is northwest


### Moon position

```javascript
SunCalc.getMoonPosition(/*Date*/ timeAndDate, /*Number*/ latitude, /*Number*/ longitude)
```

Returns an object with the following properties:

 * `altitude`: moon altitude above the horizon in radians
 * `azimuth`: moon azimuth in radians
 * `distance`: distance to moon in kilometers


### Moon illumination

```javascript
SunCalc.getMoonIllumination(/*Date*/ timeAndDate)
```

Returns an object with the following properties:

 * `fraction`: illuminated fraction of the moon; varies from `0.0` (new moon) to `1.0` (full moon)
 * `phase`: moon phase; varies from `0.0` to `1.0`, described below
 * `angle`: midpoint angle in radians of the illuminated limb of the moon reckoned eastward from the north point of the disk;
 the moon is waxing if the angle is negative, and waning if positive

Moon phase value should be interpreted like this:

| Phase | Name            |
| -----:| --------------- |
| 0     | New Moon        |
|       | Waxing Crescent |
| 0.25  | First Quarter   |
|       | Waxing Gibbous  |
| 0.5   | Full Moon       |
|       | Waning Gibbous  |
| 0.75  | Last Quarter    |
|       | Waning Crescent |


## Changelog

#### 1.5.1 &mdash; May 16, 2014

- Exposed `SunCalc.times` property with defined daylight times.
- Slightly improved `SunCalc.getTimes` performance.

#### 1.4.0 &mdash; Apr 10, 2014

- Added `phase` to `SunCalc.getMoonIllumination` results (moon phase).
- Switched from mocha to tape for tests.

#### 1.3.0 &mdash; Feb 21, 2014

- Added `SunCalc.getMoonIllumination` (in place of `getMoonFraction`) that returns an object with `fraction` and `angle`
(angle of illuminated limb of the moon).

#### 1.2.0 &mdash; Mar 07, 2013

- Added `SunCalc.getMoonFraction` function that returns illuminated fraction of the moon.

#### 1.1.0 &mdash; Mar 06, 2013

- Added `SunCalc.getMoonPosition` function.
- Added nadir (darkest time of the day, middle of the night).
- Added tests.

#### 1.0.0 &mdash; Dec 07, 2011

- Published to NPM.
- Added `SunCalc.addTime` function.

#### 0.0.0 &mdash; Aug 25, 2011

- First commit.

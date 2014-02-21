
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


## Using in a server environment

In addition to browsers, SunCalc can be used in server environments like Node,
and is available as an NPM package (`npm install suncalc`).

```js
var SunCalc = require('suncalc');
```


## Reference

### Sunlight times

```javascript
SunCalc.getTimes(/*Date*/ date, /*Number*/ latitude, /*Number*/ longitude)
```

Returns an object with the following properties (each is a `Date` object):

 * `sunrise`: sunrise (top edge of the sun appears on the horizon)
 * `sunriseEnd`: sunrise ends (bottom edge of the sun touches the horizon)
 * `goldenHourEnd`: morning golden hour (soft light, best time for photography) ends
 * `solarNoon`: solar noon (sun is in the highest position)
 * `goldenHour`: evening golden hour starts
 * `sunsetStart`: sunset starts (bottom edge of the sun touches the horizon)
 * `sunset`: sunset (sun disappears below the horizon, evening civil twilight starts)
 * `dusk`: dusk (evening nautical twilight starts)
 * `nauticalDusk`: nautical dusk (evening astronomical twilight starts)
 * `night`: night starts (dark enough for astronomical observations)
 * `nightEnd`: night ends (morning astronomical twilight starts)
 * `nauticalDawn`: nautical dawn (morning nautical twilight starts)
 * `dawn`: dawn (morning nautical twilight ends, morning civil twilight starts)
 * `nadir`: nadir (darkest moment of the night, sun is in the lowest position)

```javascript
SunCalc.addTime(/*Number*/ angleInDegrees, /*String*/ morningName, /*String*/ eveningName)
```

Adds a custom time when the sun reaches the given angle to results returned by `SunCalc.getTimes`.


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
 * `angle`: midpoint angle in radians of the illuminated limb of the moon reckoned eastward from the north point of the disk;
 the moon is waxing if the angle is negative, and waning if positive

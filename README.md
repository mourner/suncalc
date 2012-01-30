SunCalc
=======

SunCalc is a tiny BSD-licensed JavaScript library for calculating sun position and sunlight phases (times for sunrise, sunset, dusk, etc.) for the given location and time, created by [Vladimir Agafonkin](http://agafonkin.com/en) ([@mourner](https://github.com/mourner)) as a part of the [SunCalc.net project](http://suncalc.net).

All calculations are based on the formulae given in the excellent [Astronomy Answers article about position of the sun](http://aa.quae.nl/en/reken/zonpositie.html). You can read about different twilight phases calculated by SunCalc in the [Twilight article on Wikipedia](http://en.wikipedia.org/wiki/Twilight).

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

In addition to browsers, SunCalc can be used in server environments like Node:

```javascript
var SunCalc = require('suncalc');
// [...] (use SunCalc object as usual)
```

It is available as an NPM package, so you can install it with `npm install suncalc`.

## Reference

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

```javascript
SunCalc.getPosition(/*Date*/ timeAndDate, /*Number*/ latitude, /*Number*/ longitude)
```

Returns an object with the following properties:

 * `altitude`: sun altitude above the horizon in radians, e.g. `0` at the horizon and `PI/2` at the zenith (straight over your head)
 * `azimuth`: sun azimuth in radians (direction along the horizon, measured from south to west), e.g. `0` is south and `Math.PI * 3/4` is northwest

```javascript
SunCalc.addTime(/*Number*/ angleInDegrees, /*String*/ morningName, /*String*/ eveningName)
```

Adds a custom time when the sun reaches the given angle to results returned by `SunCalc.getTimes`.

SunCalc
=======

SunCalc is a tiny BSD-licensed JavaScript library for calculating sun position and sunlight phases for the given location and time, created by [Vladimir Agafonkin](http://agafonkin.com/en) ([@mourner](https://github.com/mourner)) as a part of the [SunCalc.net project](http://suncalc.net).

All calculations are based on the formulae given in the excellent [Astronomy Answers article about position of the sun](http://www.astro.uu.nl/~strous/AA/en/reken/zonpositie.html). You can read about different twilight phases calculated by SunCalc in the [Twilight article on Wikipedia](http://en.wikipedia.org/wiki/Twilight).

## Usage example

```javascript
// get today's sunlight times for London
var times = SunCalc.getTimes(new Date(), 51.5, -0.1);

// get position of the sun (azimuth and altitude) at today's sunrise
var sunrisePos = SunCalc.getSunPosition(times.sunrise, 51.5, -0.1);

// get sunrise azimuth in degrees
var sunriseAzimuth = sunrisePos.azimuth * SunCalc.rad2deg;
```

## Reference

```javascript
SunCalc.getTimes(/*Date*/ date, /*Number*/ latitude, /*Number*/ longitude)
```

Returns an object with the following properties (each is a `Date` object):

 * `sunrise`: sunrise (top edge of the sun appears on the horizon)
 * `sunriseStart`: sunrise ends (bottom edge of the sun touches the horizon)
 * `solarNoon`: solar noon (sun is in the highest position)
 * `sunsetStart`: sunset starts (bottom edge of the sun touches the horizon)
 * `sunset`: sunset (sun disappears below the horizon, evening civil twilight starts)
 * `dusk`: dusk (evening nautical twilight starts)
 * `nauticalDusk`: nautical dusk (evening astronomical twilight starts)
 * `night`: night starts (dark enough for astronomical observations)
 * `nightEnd`: night ends (morning astronomical twilight starts)
 * `nauticalDawn`: nautical dawn (morning nautical twilight starts)
 * `dawn`: dawn (morning nautical twilight ends, morning civil twilight starts)
 
```javascript
SunCalc.getSunPosition(/*Date*/ timeAndDate, /*Number*/ latitude, /*Number*/ longitude)
```

Returns an object with the following properties:

 * `altitude`: sun altitude above the horizon in radians, e.g. `0` at the horizon and `PI/2` at the zenith (straight over your head)
 * `azimuth`: sun azimuth in radians (direction along the horizon, measured from south to west), e.g. `0` is south and `Math.PI * 3/4` is northwest
 
```
SunCalc.rad2deg
```

Multiplier for converting radians to degrees or back, equals `180 / Math.PI`.

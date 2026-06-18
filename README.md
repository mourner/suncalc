SunCalc
=======

SunCalc is a tiny, dependency-free JavaScript library for calculating sun position,
sunlight phases (sunrise, sunset, dusk, etc.), moon position, moonrise and moonset
times, and lunar phase for any location and time.
It matches the accuracy and conventions of [timeanddate.com](https://www.timeanddate.com/)
and the [U.S. Naval Observatory](https://aa.usno.navy.mil/).

Calculations are based on the formulas from Jean Meeus' *Astronomical Algorithms*.

You can read about different twilight phases calculated by SunCalc
in the [Twilight article on Wikipedia](http://en.wikipedia.org/wiki/Twilight).

## Example

Install with `npm install suncalc`, then:

```javascript
import * as SunCalc from 'suncalc';

const times = SunCalc.getTimes(new Date(), 51.5, -0.1); // get today's sunlight times for London

console.log(`Sunrise time: ${times.sunrise.toLocaleString()}`);

const sunrisePos = SunCalc.getPosition(times.sunrise, 51.5, -0.1); // get Sun position at today's sunrise

console.log(`Sunrise direction: ${sunrisePos.azimuth} degrees`);
```

## Reference

### Sunlight times

```javascript
SunCalc.getTimes(date, latitude, longitude, height = 0)
```

Returns sunlight times for the solar day containing `date`, at the given latitude,
longitude and (optional) observer `height` above the horizon in meters.

The result is an object whose properties are `Date` objects (or `null` when the
event doesn't occur that day):

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

`solarNoon` and `nadir` are always present. At high latitudes, when the sun stays
above or below the rise/set altitude for the whole day, the rise/set-related times
are `null` and one of these flags is set:

 * `alwaysUp`: `true` when the sun never sets that day (polar day)
 * `alwaysDown`: `true` when the sun never rises that day (polar night)

```javascript
SunCalc.addTime(angleInDegrees, morningName, eveningName)
```

Adds a custom time when the sun reaches the given altitude angle (in degrees) to
the results returned by `SunCalc.getTimes`. The `morningName` is used for the
ascending (morning) crossing and `eveningName` for the descending (evening) one.

`SunCalc.times` contains all currently defined times as
`[angleInDegrees, morningName, eveningName]` rows.

For example, to add the [blue hour](https://en.wikipedia.org/wiki/Blue_hour)
(roughly −4° to −8°) with your own preferred angles:

```javascript
SunCalc.addTime(-4, 'morningBlueHourEnd', 'blueHour');
SunCalc.addTime(-8, 'morningBlueHour', 'blueHourEnd');
```

### Sun position

```javascript
SunCalc.getPosition(timeAndDate, latitude, longitude)
```

Returns an object with the following properties:

 * `altitude`: apparent (refraction-corrected) sun altitude above the horizon in
   degrees, e.g. `0` at the horizon and `90` at the zenith (straight overhead)
 * `azimuth`: sun azimuth in degrees, clockwise from north
   (`0` = N, `90` = E, `180` = S, `270` = W)

### Moon position

```javascript
SunCalc.getMoonPosition(timeAndDate, latitude, longitude)
```

Returns an object with the following properties:

 * `altitude`: apparent moon altitude above the horizon in degrees
 * `azimuth`: moon azimuth in degrees, clockwise from north
 * `distance`: distance to the moon in kilometers
 * `parallacticAngle`: parallactic angle of the moon in degrees

### Moon illumination

```javascript
SunCalc.getMoonIllumination(timeAndDate)
```

Returns an object with the following properties:

 * `fraction`: illuminated fraction of the moon; varies from `0.0` (new moon) to
   `1.0` (full moon). It reaches the exact extremes only at perfect syzygy
   (eclipses), so a "full" moon typically peaks a hair under `1.0`
 * `phase`: moon phase; varies from `0.0` to `1.0`, described below
 * `angle`: position angle of the bright limb in degrees, reckoned eastward from
   the north point of the disk
 * `waxing`: `true` while the moon is waxing (new → full), `false` while waning
   (full → new)

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

By subtracting `getMoonPosition().parallacticAngle` from `angle` (both in degrees)
you get the zenith angle of the moon's bright limb (anticlockwise). The zenith
angle can be used to draw the moon's shape from the observer's perspective
(e.g. moon lying on its back).

### Moon rise and set times

```js
SunCalc.getMoonTimes(date, latitude, longitude)
```

Returns an object with the following properties:

 * `rise`: moonrise time as a `Date`
 * `set`: moonset time as a `Date`
 * `alwaysUp`: `true` if the moon is always _above_ the horizon during the day
 * `alwaysDown`: `true` if the moon is always _below_ the horizon

Unlike the sun, the moon can rise and set zero, one, or two times within a single
day, so this function scans a fixed 24-hour window: the **UTC calendar day** of the
given date (consistent with the rest of the API, which treats dates as UTC
instants). If you want the window to follow an observer's local civil day, pass a
`date` set to their local midnight.

## Changelog

See the [Releases page](https://github.com/mourner/suncalc/releases) for the full
changelog. Note that **v2.0** is a precision-focused rewrite with breaking changes
to units and conventions — see its release notes before upgrading.

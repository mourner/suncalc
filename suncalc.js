/*
 Copyright (c) 2011-2013, Vladimir Agafonkin
 SunCalc is a JavaScript library for calculating sun position, sunlight phases, and moon position.
 https://github.com/mourner/suncalc
 */

(function (global) {

	/*jshint smarttabs: true */

	"use strict";

	// export either as a CommonJS module or a global variable

	var SunCalc;

	if (typeof exports !== 'undefined') {
		SunCalc = exports;
	} else {
		SunCalc = global.SunCalc = {};
	}


	// utility shortcuts

	var PI = Math.PI,
	    rad = PI / 180,
	    sin = Math.sin,
	    cos = Math.cos,
	    tan = Math.tan,
	    asin = Math.asin,
	    atan = Math.atan2;


	// date constants and conversions

	var dayMs = 1000 * 60 * 60 * 24,
	    J1970 = 2440588,
	    J2000 = 2451545;

	function toJulian(date) {
		return date.valueOf() / dayMs - 0.5 + J1970;
	}
	function fromJulian(j) {
		return new Date((j + 0.5 - J1970) * dayMs);
	}


	// constants for sun calculations

	var M0  = rad * 357.5291,
	    M1  = rad * 0.98560028,
	    J0  = 0.0009,
	    J1  = 0.0053,
	    J2  = -0.0069,
	    C1  = rad * 1.9148,
	    C2  = rad * 0.0200,
	    C3  = rad * 0.0003,
	    P   = rad * 102.9372,
	    e   = rad * 23.4397,
	    th0 = rad * 280.1600,
	    th1 = rad * 360.9856235;


	// general sun calculations

	function getSolarMeanAnomaly(Js) {
		return M0 + M1 * (Js - J2000);
	}
	function getEquationOfCenter(M) {
		return C1 * sin(M) + C2 * sin(2 * M) + C3 * sin(3 * M);
	}
	function getEclipticLongitude(M, C) {
		return M + P + C + PI;
	}
	function getSunDeclination(Ls) {
		return asin(sin(Ls) * sin(e));
	}
	function getRightAscension(Ls) {
		return atan(sin(Ls) * cos(e), cos(Ls));
	}


	// calculations for sun position

	function getSiderealTime(J, lw) {
		return th0 + th1 * (J - J2000) - lw;
	}
	function getAzimuth(H, phi, d) {
		return atan(sin(H), cos(H) * sin(phi) - tan(d) * cos(phi));
	}
	function getAltitude(H, phi, d) {
		return asin(sin(phi) * sin(d) + cos(phi) * cos(d) * cos(H));
	}


	// calculations for sun times

	function getJulianCycle(J, lw) {
		return Math.round(J - J2000 - J0 - lw / (2 * PI));
	}
	function getApproxTransit(Ht, lw, n) {
		return J2000 + J0 + (Ht + lw) / (2 * PI) + n;
	}
	function getSolarTransit(Js, M, Ls) {
		return Js + (J1 * sin(M)) + (J2 * sin(2 * Ls));
	}
	function getHourAngle(h, phi, d) {
		return Math.acos((sin(h) - sin(phi) * sin(d)) / (cos(phi) * cos(d)));
	}


	// calculates sun azimuth and altitude for a given date and latitude/longitude

	SunCalc.getPosition = function (date, lat, lng) {

		var lw  = rad * -lng,
		    phi = rad * lat,
		    J   = toJulian(date),

		    M  = getSolarMeanAnomaly(J),
		    C  = getEquationOfCenter(M),
		    Ls = getEclipticLongitude(M, C),
		    d  = getSunDeclination(Ls),
		    a  = getRightAscension(Ls),
		    th = getSiderealTime(J, lw),
		    H  = th - a;

		return {
			azimuth: getAzimuth(H, phi, d),
			altitude: getAltitude(H, phi, d)
		};
	};


	// times configuration (angle, morning name, evening name)

	var times = [
		[-0.83, 'sunrise',       'sunset'      ],
		[ -0.3, 'sunriseEnd',    'sunsetStart' ],
		[   -6, 'dawn',          'dusk'        ],
		[  -12, 'nauticalDawn',  'nauticalDusk'],
		[  -18, 'nightEnd',      'night'       ],
		[    6, 'goldenHourEnd', 'goldenHour'  ]
	];

	// adds a custom time to the times config

	SunCalc.addTime = function (angle, riseName, setName) {
		times.push([angle, riseName, setName]);
	};


	// calculates sun times for a given date and latitude/longitude

	SunCalc.getTimes = function (date, lat, lng) {

		var lw  = rad * -lng,
		    phi = rad * lat,
		    J   = toJulian(date),

		    n  = getJulianCycle(J, lw),
		    Js = getApproxTransit(0, lw, n),
		    M  = getSolarMeanAnomaly(Js),
		    C  = getEquationOfCenter(M),
		    Ls = getEclipticLongitude(M, C),
		    d  = getSunDeclination(Ls),

		    Jnoon = getSolarTransit(Js, M, Ls);


		function getSetJ(h) {
			var w = getHourAngle(h, phi, d),
			    a = getApproxTransit(w, lw, n);
			return getSolarTransit(a, M, Ls);
		}


		var result = {
			solarNoon: fromJulian(Jnoon),
			nadir: fromJulian(Jnoon - 0.5)
		};

		var i, len, time,
		    angle, morningName, eveningName,
		    Jset, Jrise;

		for (i = 0, len = times.length; i < len; i += 1) {

			time = times[i];

			angle = time[0];
			morningName = time[1];
			eveningName = time[2];

			Jset = getSetJ(angle * rad);
			Jrise = Jnoon - (Jset - Jnoon);

			result[morningName] = fromJulian(Jrise);
			result[eveningName] = fromJulian(Jset);
		}

		return result;
	};


	// moon calculations

	function getMoonRightAscension(l, b) {
		return atan(sin(l) * cos(e) - tan(b) * sin(e), cos(l));
	}

	function getMoonDeclination(l, b) {
		return asin(sin(b) * cos(e) + cos(b) * sin(e) * sin(l));
	}
	function getRefractedAltitude(h) {
		return h + 0.017 * rad / tan(h + 10.26 * rad / (h + 5.10 * rad));
	}


	SunCalc.getMoonPosition = function (date, lat, lng) {

		var lw  = rad * -lng,
		    phi = rad * lat,

		    J  = toJulian(date),
		    Jd = J - J2000,

		    L = 218.316 + 13.176396 * Jd,
		    M = 134.963 + 13.064993 * Jd,
		    F = 93.272 + 13.229350 * Jd,
		    l = rad * (L + 6.289 * sin(rad * M)),
		    b = rad * 5.128 * sin(rad * F),
		    dt = 385001 - 20905 * cos(rad  * M),

		    a = getMoonRightAscension(l, b),
			d = getMoonDeclination(l, b),
		    th = getSiderealTime(J, lw),
		    H = th - a;

		return {
			azimuth: getAzimuth(H, phi, d),
			altitude: getRefractedAltitude(getAltitude(H, phi, d)),
			distance: dt
		};
	};

}(this));

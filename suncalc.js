/**
 * @preserve Copyright (c) 2011, Vladimir Agafonkin
 * SunCalc is an Open Source JavaScript library for calculating sun position and sunlight phases for the given location and time.
 * See https://github.com/mourner/suncalc for source code and more information.
 */

/*jslint browser: true, node: true, vars: true */

(function (global) {
	"use strict";
	
	var SunCalc = {};
	
	if (typeof module !== 'undefined' && module.exports) {
		module.exports = SunCalc;
	} else {
		global.SunCalc = SunCalc;
	}
	
	var times = [
		[-0.83, 'sunrise', 'sunset'],
		[ -0.3, 'sunriseEnd', 'sunsetStart'],
		[   -6, 'dawn', 'dusk'],
		[  -12, 'nauticalDawn', 'nauticalDusk'],
		[  -18, 'night', 'nightEnd'],
		[    6, 'goldenHourEnd', 'goldenHour']
	];
	
	var m = Math,
	    J1970 = 2440588,
	    J2000 = 2451545,
	    deg2rad = m.PI / 180,
	    msInDay = 1000 * 60 * 60 * 24,
	    M0 = 357.5291 * deg2rad,
	    M1 = 0.98560028 * deg2rad,
	    J0 = 0.0009,
	    J1 = 0.0053,
	    J2 = -0.0069,
	    C1 = 1.9148 * deg2rad,
	    C2 = 0.0200 * deg2rad,
	    C3 = 0.0003 * deg2rad,
	    P = 102.9372 * deg2rad,
	    e = 23.45 * deg2rad,
	    th0 = 280.1600 * deg2rad,
	    th1 = 360.9856235 * deg2rad;

	function dateToJulianDate(date) { 
		return date.valueOf() / msInDay - 0.5 + J1970; 
	}
	
	function julianDateToDate(j) { 
		return new Date((j + 0.5 - J1970) * msInDay); 
	}
	
	function getJulianCycle(J, lw) { 
		return m.round(J - J2000 - J0 - lw / (2 * m.PI)); 
	}
	
	function getApproxSolarTransit(Ht, lw, n) { 
		return J2000 + J0 + (Ht + lw) / (2 * m.PI) + n; 
	}
	
	function getSolarMeanAnomaly(Js) { 
		return M0 + M1 * (Js - J2000); 
	}
	
	function getEquationOfCenter(M) { 
		return C1 * m.sin(M) + C2 * m.sin(2 * M) + C3 * m.sin(3 * M); 
	}
	
	function getEclipticLongitude(M, C) { 
		return M + P + C + m.PI; 
	}
	
	function getSolarTransit(Js, M, Lsun) { 
		return Js + (J1 * m.sin(M)) + (J2 * m.sin(2 * Lsun)); 
	}
	
	function getSunDeclination(Lsun) { 
		return m.asin(m.sin(Lsun) * m.sin(e)); 
	}
	
	function getRightAscension(Lsun) {
		return m.atan2(m.sin(Lsun) * m.cos(e), m.cos(Lsun));
	}
	
	function getSiderealTime(J, lw) {
		return th0 + th1 * (J - J2000) - lw;
	}
	
	function getAzimuth(th, a, phi, d) {
		var H = th - a;
		return m.atan2(m.sin(H), m.cos(H) * m.sin(phi) - 
				m.tan(d) * m.cos(phi));
	}
	
	function getAltitude(th, a, phi, d) {
		var H = th - a;
		return m.asin(m.sin(phi) * m.sin(d) + 
				m.cos(phi) * m.cos(d) * m.cos(H));
	}
	
	function getHourAngle(h, phi, d) { 
		return m.acos((m.sin(h) - m.sin(phi) * m.sin(d)) / 
				(m.cos(phi) * m.cos(d))); 
	}
	
	SunCalc.addTime = function (angle, riseName, setName) {
		times.push([angle, riseName, setName]);
	};
	
	SunCalc.getTimes = function (date, lat, lng) {
		var lw = -lng * deg2rad,
		    phi = lat * deg2rad,
		    J = dateToJulianDate(date),
		    n = getJulianCycle(J, lw),
		    Js = getApproxSolarTransit(0, lw, n),
		    M = getSolarMeanAnomaly(Js),
		    C = getEquationOfCenter(M),
		    Lsun = getEclipticLongitude(M, C),
		    d = getSunDeclination(Lsun),
		    Jtransit = getSolarTransit(Js, M, Lsun);
			
		function getSunsetJ(h) { 
			var w = getHourAngle(h, phi, d),
			    approx = getApproxSolarTransit(w, lw, n);
			return getSolarTransit(approx, M, Lsun); 
		}
		
		function getSunriseJ(Jset) { 
			return Jtransit - (Jset - Jtransit); 
		}
			
		var result = {solarNoon: julianDateToDate(Jtransit)},
			i, len, time, Jset, Jrise;
		
		for (i = 0, len = times.length; i < len; i++) {
			time = times[i];
			Jset = getSunsetJ(time[0] * deg2rad);
			Jrise = getSunriseJ(Jset);
			
			result[time[1]] = julianDateToDate(Jrise);
			result[time[2]] = julianDateToDate(Jset);
		}
		
		return result;
	};
		
	SunCalc.getSunPosition = function (date, lat, lng) {
		var lw = -lng * deg2rad,
		    phi = lat * deg2rad,
		    J = dateToJulianDate(date),
		    M = getSolarMeanAnomaly(J),
		    C = getEquationOfCenter(M),
		    Lsun = getEclipticLongitude(M, C),
		    d = getSunDeclination(Lsun),
		    a = getRightAscension(Lsun),
		    th = getSiderealTime(J, lw);
		
		return {
			azimuth: getAzimuth(th, a, phi, d),
			altitude: getAltitude(th, a, phi, d)
		};
	};
	
	SunCalc.rad2deg = 1 / deg2rad;
}(this));
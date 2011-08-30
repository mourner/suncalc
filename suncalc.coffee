"use strict"

SunCalc = exports ? this.SunCalc = {}


{PI, sin, cos, tan, asin, acos, atan2, round} = Math

deg2rad = PI / 180
msInDay = 1000 * 60 * 60 * 24

J1970 = 2440588
J2000 = 2451545
M0    = 357.5291 * deg2rad
M1    = 0.98560028 * deg2rad
J0    = 0.0009
J1    = 0.0053
J2    = -0.0069
C1    = 1.9148 * deg2rad
C2    = 0.0200 * deg2rad
C3    = 0.0003 * deg2rad
P     = 102.9372 * deg2rad
e     = 23.45 * deg2rad
th0   = 280.1600 * deg2rad
th1   = 360.9856235 * deg2rad


dateToJulianDate      = (date) -> date.valueOf() / msInDay - 0.5 + J1970
julianDateToDate      = (j)    -> new Date((j + 0.5 - J1970) * msInDay)

getSolarMeanAnomaly   = (Js)   -> M0 + M1 * (Js - J2000)
getEquationOfCenter   = (M)    -> C1 * sin(M) + C2 * sin(2 * M) + C3 * sin(3 * M)
getEclipticLongitude  = (M, C) -> M + P + C + PI
getSunDeclination     = (Ls)   -> asin(sin(Ls) * sin(e))

getJulianCycle        = (J, lw)     -> round(J - J2000 - J0 - lw / (2 * PI))
getApproxSolarTransit = (Ht, lw, n) -> J2000 + J0 + (Ht + lw) / (2 * PI) + n
getSolarTransit       = (Js, M, Ls) -> Js + (J1 * sin(M)) + (J2 * sin(2 * Ls))
getHourAngle          = (h, phi, d) -> acos((sin(h) - sin(phi) * sin(d)) / (cos(phi) * cos(d)))

getRightAscension     = (Ls)        -> atan2(sin(Ls) * cos(e), cos(Ls))
getSiderealTime       = (J, lw)     -> th0 + th1 * (J - J2000) - lw
getAzimuth            = (h, phi, d) -> atan2(sin(h), cos(h) * sin(phi) - tan(d) * cos(phi))
getAltitude           = (h, phi, d) -> asin(sin(phi) * sin(d) + cos(phi) * cos(d) * cos(h))


times = [[-0.83, 'sunrise',       'sunset']
	     [ -0.3, 'sunriseEnd',    'sunsetStart']
	     [   -6, 'dawn',          'dusk']
	     [  -12, 'nauticalDawn',  'nauticalDusk']
	     [  -18, 'night',         'nightEnd']
	     [    6, 'goldenHourEnd', 'goldenHour']]

SunCalc.addTime = (angle, morningName, eveningName) -> 
	times.push [angle, morningName, eveningName]

SunCalc.getTimes = (date, lat, lng) ->
	lw  = -lng * deg2rad
	phi =  lat * deg2rad
	J   = dateToJulianDate      date
	n   = getJulianCycle        J, lw
	Js  = getApproxSolarTransit 0, lw, n
	M   = getSolarMeanAnomaly   Js
	C   = getEquationOfCenter   M
	Ls  = getEclipticLongitude  M, C
	d   = getSunDeclination     Ls
	Jnoon = getSolarTransit     Js, M, Ls
		
	result = {solarNoon: julianDateToDate Jnoon}
	
	for [angle, morningName, eveningName] in times
	    h    = angle * deg2rad
		w    = getHourAngle          h, phi, d
		a    = getApproxSolarTransit w, lw, n
		Jset = getSolarTransit       a, M, Ls
		
		result[eveningName] = julianDateToDate Jset
		result[morningName] = julianDateToDate Jnoon - (Jset - Jnoon)
	
	result

SunCalc.getSunPosition = (date, lat, lng) ->
	lw  = -lng * deg2rad
	phi =  lat * deg2rad
	J   = dateToJulianDate     date
	M   = getSolarMeanAnomaly  J
	C   = getEquationOfCenter  M
	Ls  = getEclipticLongitude M, C
	d   = getSunDeclination    Ls
	a   = getRightAscension    Ls
	th  = getSiderealTime      J, lw
	h   = th - a
	
	azimuth  = getAzimuth  h, phi, d
	altitude = getAltitude h, phi, d
	
	{azimuth, altitude}

SunCalc.rad2deg = 1 / deg2rad
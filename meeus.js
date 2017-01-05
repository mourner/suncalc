
const RAD = Math.PI / 180;

// Unix time to Julian day
function julian(date) {
    return date / 86400000 + 2440587.5;
}

// Julian day to Julian centuries since J2000
function centuries(jd) {
    return (jd - 2451545) / 36525; // 25.1
}

// Geometric mean longitude of the Sun
function meanLongitude(t) {
    return RAD * (280.46646 + t * (36000.76983 + t * 0.0003032)); // 25.2
}

// Geometric mean anomaly of the Sun
function meanAnomaly(t) {
    return RAD * (357.52911 + t * (35999.05029 - t * 0.0001537)); // 25.3
}

// Equation of center of the Sun
function equationOfCenter(t) {
    const m = meanAnomaly(t);
    return RAD * (1.914602 - t * (0.004817 - t * 0.000014)) * Math.sin(m) +
        (0.019993 - 0.000101 * t) * Math.sin(2 * m) +
        0.000289 * Math.sin(3 * m);
}

// True geometric longitude of the Sun
function trueLongitude(t) {
    const L0 = meanLongitude(t);
    const C = equationOfCenter(t);
    return L0 + C;
}

// Apparent longitude of the Sun
function apparentLongitude(t) {
    return trueLongitude(t) - RAD * (0.00569 + 0.00478 * Math.cos(RAD * (125.04 - 1934.136 * t)));
}

// Mean obliquity of the ecliptic
function meanObliquity(t) {
    return RAD * (84381.448 - t * (46.815 - t * (0.00059 + 0.001813 * t))) / 3600;
}

// Corrected obliquity of the ecliptic for apparent position of the Sun
function correctedObliquity(t) {
    return meanObliquity(t) + RAD * 0.00256 * Math.cos(RAD * (125.04 - 1934.136 * t)); // 25.8
}

// Apparent position of the Sun in equatorial coordinates
function apparentEquatorial(t) {
    const l = apparentLongitude(t);
    const e = correctedObliquity(t);
    const sl = Math.sin(l);
    const ra = Math.atan2(Math.cos(e) * sl, Math.cos(l)); // 25.6
    const dec = Math.asin(Math.sin(e) * sl); // 25.7
    return {ra, dec};
}

function meanSiderealTime(jd) {
    return RAD * (280.46061837 + 360.9856235 * (jd - 2451545)); // 12.4 with small terms dropped
}

function getPosition(date, lat, lng) {
    const jd = julian(date);
    const t = centuries(jd);
    const c = apparentEquatorial(t);

    const lw = RAD * -lng;
    const phi = RAD * lat;
    const h = meanSiderealTime(jd) - lw - c.ra;

    const ch = Math.cos(h);
    const sh = Math.sin(h);
    const sphi = Math.sin(phi);
    const cphi = Math.cos(phi);
    const sdec = Math.sin(c.dec);
    const cdec = Math.cos(c.dec);

    const azimuth = Math.atan2(sh, ch * sphi - (sdec / cdec) * cphi);
    const altitude = Math.asin(sphi * sdec + cphi * cdec * ch);

    return {azimuth, altitude};
}

exports.getPosition = getPosition;

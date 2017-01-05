
const RAD = Math.PI / 180;

function julian(date) {
    return 2440588 + date / 86400000 - 0.5;
}

function centuries(jd) {
    return (jd - 2451545) / 36525; // 25.1
}

function geometricMeanLongitude(t) {
    return RAD * (280.46646 + 36000.76983 * t + 0.0003032 * t * t); // 25.2
}

function meanAnomaly(t) {
    return RAD * (357.52911 + 35999.05029 * t - 0.0001537 * t * t); // 25.3
}

function equationOfCenter(t) {
    const m = meanAnomaly(t);
    return RAD * (1.914602 - 0.004817 * t - 0.000014 * t * t) * Math.sin(m) +
        (0.019993 - 0.000101 * t) * Math.sin(2 * m) +
        0.000289 * Math.sin(3 * m);
}

function trueGeometricLongitude(t) {
    const L0 = geometricMeanLongitude(t);
    const C = equationOfCenter(t);
    return L0 + C;
}

function meanObliquity(t) {
    return RAD * (84381.448 - 46.815 * t - 0.00059 * t * t + 0.001813 * t * t * t) / 3600;
}

function apparentEquatorial(t) {
    const c = Math.cos(RAD * (125.04 - 1934.136 * t));
    const l = trueGeometricLongitude(t) - RAD * (0.00569 - 0.00478 * c); // apparent longitude
    const e = meanObliquity(t) + RAD * 0.00256 * c; // 25.8
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

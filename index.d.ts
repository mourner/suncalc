// Type definitions for SunCalc v2.
// All angles are in degrees; azimuth is north-based clockwise (0 = N, 90 = E, 180 = S, 270 = W).
// Dates are UTC instants in and out — no local-timezone conversion is applied.

/** Sun or Moon horizontal position. */
export interface Position {
    /** Azimuth, degrees clockwise from north (0 = N, 90 = E, 180 = S, 270 = W). */
    azimuth: number;
    /** Apparent (refraction-corrected) altitude above the horizon, degrees. */
    altitude: number;
}

export function getPosition(date: Date, lat: number, lng: number): Position;

/** Built-in sun-time names (each may be `null` at high latitudes when the event doesn't occur). */
export type SunTimeName =
    | 'sunrise' | 'sunset'
    | 'sunriseEnd' | 'sunsetStart'
    | 'dawn' | 'dusk'
    | 'nauticalDawn' | 'nauticalDusk'
    | 'nightEnd' | 'night'
    | 'goldenHourEnd' | 'goldenHour';

export type SunTimes = Record<SunTimeName, Date | null> & {
    /** Local solar noon (Sun's highest point). */
    solarNoon: Date;
    /** Local solar midnight (Sun's lowest point). */
    nadir: Date;
    /** Set when the Sun stays above the rise/set altitude all day (polar day). */
    alwaysUp?: boolean;
    /** Set when the Sun stays below the rise/set altitude all day (polar night). */
    alwaysDown?: boolean;
    /** Custom times added via `addTime`. */
    [custom: string]: Date | boolean | null | undefined;
};

/**
 * Sun times for the input date's solar day (independent of the time-of-day passed in),
 * at the given latitude/longitude and optional observer height in meters.
 */
export function getTimes(date: Date, lat: number, lng: number, height?: number): SunTimes;

/** Sun-time config rows: `[altitudeAngleDeg, morningName, eveningName]`. */
export const times: Array<[number, string, string]>;

/** Adds a custom sun time (altitude angle in degrees) to `times`. */
export function addTime(angle: number, riseName: string, setName: string): void;

export interface MoonPosition extends Position {
    /** Distance to the Moon, kilometers. */
    distance: number;
    /** Parallactic angle, degrees. */
    parallacticAngle: number;
}

export function getMoonPosition(date: Date, lat: number, lng: number): MoonPosition;

export interface MoonIllumination {
    /** Illuminated fraction, 0 (new) → 1 (full). */
    fraction: number;
    /** Phase, 0 → 1: 0 new, 0.25 first quarter, 0.5 full, 0.75 last quarter. */
    phase: number;
    /** Position angle of the bright limb, degrees. */
    angle: number;
    /** `true` while waxing (new → full), `false` while waning (full → new). */
    waxing: boolean;
}

export function getMoonIllumination(date?: Date): MoonIllumination;

export interface MoonTimes {
    /** Moonrise; absent if there's no rise during the day. */
    rise?: Date;
    /** Moonset; absent if there's no set during the day. */
    set?: Date;
    /** Set when the Moon stays above the horizon all day. */
    alwaysUp?: boolean;
    /** Set when the Moon stays below the horizon all day. */
    alwaysDown?: boolean;
}

/** Moon rise/set times over the UTC calendar day of the given date. */
export function getMoonTimes(date: Date, lat: number, lng: number): MoonTimes;

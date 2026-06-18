import {defineConfig} from 'rolldown';

// Builds a UMD bundle from the ESM source. It serves both the legacy CommonJS
// `require('suncalc')` entry point and direct <script> tag use (exposes a global
// `SunCalc`). The package stays ESM-first; this is purely for compatibility.
export default defineConfig({
    input: 'index.js',
    output: {
        file: 'suncalc.cjs',
        format: 'umd',
        name: 'SunCalc'
    }
});

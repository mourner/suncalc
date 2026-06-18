import config from 'eslint-config-mourner';

export default [
    {ignores: ['suncalc.cjs']},
    ...(Array.isArray(config) ? config : [config])
];

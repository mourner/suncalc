const { merge } = require('webpack-merge');
const common = require('./webpack.common');

module.exports = merge(common, {
    mode: 'development',
    output: {
        filename: 'suncalc.dev.js',
    },
    devtool: 'eval-source-map',
})

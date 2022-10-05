const path = require('path');

module.exports = {
    entry: './suncalc.ts',
    output: {
        library: {
            name: 'SunCalc',
            type: 'umd',
        },
        path: path.resolve(__dirname),
        globalObject: 'this',
    },
    module: {
        rules: [
            {
                test: /\.ts$/,
                loader: 'ts-loader',
                exclude: /node_modules/,
            },
        ],
    },
};

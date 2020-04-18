const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');

module.exports = {
    entry: {
        background: './src/index.ts',
        options: './src/view/options.ts',
        addTorrent: './src/view/add_torrent.ts',
    },
    output: {
        filename: '[name].js',
        path: __dirname + '/dist/'
    },
    devtool: 'source-map',
    plugins: [
        new CleanWebpackPlugin(),
        new CopyPlugin([
            { from: './src/', to: '.', ignore: ['*.ts'], },
        ]),
    ],
    resolve: {
        extensions: ['.ts']
    },
    module: {
        rules: [
            { test: /\.ts$/, loader: 'ts-loader' },
        ]
    },
};
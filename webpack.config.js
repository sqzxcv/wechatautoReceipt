var webpack = require('webpack');
var WebpackDevServer = require("webpack-dev-server");

module.exports = {
    entry: './index.js',
    output: {
        path: __dirname,
        filename: 'bundle.js'
    },
    module: {
    },
    plugins: [
        new webpack.HotModuleReplacementPlugin()
    ],
    target: 'node',
    externals: nodeModules
}





const { merge } = require('webpack-merge');
const baseConfig = require('./webpack.config.base.js');
const webpack = require('webpack');
// const UglifyJsPlugin = require('uglifyjs-webpack-plugin');

module.exports = merge(baseConfig, {
  mode: 'production',
  plugins: [
    // Minify JS
    //new UglifyJsPlugin({
    //  sourceMap: false,
    //  // compress: true,
    //}),
    // Minify CSS
    //new webpack.LoaderOptionsPlugin({
    //  minimize: true,
    //}),
  ],
});

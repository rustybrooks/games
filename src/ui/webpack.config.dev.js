const { merge } = require('webpack-merge');
const baseConfig = require('./webpack.config.base.js');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = merge(baseConfig, {
  mode: 'development',
  devtool: 'inline-source-map',
  plugins: [
    new HtmlWebpackPlugin({
      title: 'Hot Module Replacement',
      filename: 'index.html',
      hash: true,
      template: 'src/index.html',
    }),
  ],
  devServer: {
    // static: './public',
    hot: true,
    historyApiFallback: true,
  },
});

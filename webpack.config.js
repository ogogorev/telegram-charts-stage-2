const path = require('path');

module.exports = {
  entry: './src/index.js',
  mode: 'development',
  devServer: {
    contentBase: './dist',
    hot: true
  },
  devtool: 'inline-source-map',
  // output: {
  //   path: path.resolve(__dirname, 'dist'),
  //   filename: 'bundle.js'
  // },
  output: {
    path: path.resolve(__dirname, 'docs'),
    filename: 'bundle.js'
  },
};

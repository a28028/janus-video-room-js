const path = require('path');

module.exports = {
  entry: './src/websampel.ts',
  devtool: 'inline-source-map',
  optimization: {
    minimize: true
},
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
  },
  output: {
    filename: '[name].bundle.js',
    path: path.resolve(__dirname, 'dist'),
  },
  watch : true
};
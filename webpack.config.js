// const path = require('path');

import path from 'path';

const webpackconfig = (env, argv) => {
  const isProduction = argv.mode === 'production';
  const config = {
    mode: isProduction ? 'production' : 'development',
    entry: './src/js/bundle.js',
    output: {
      filename: 'bundle.js',
      path: path.resolve(__dirname, 'dist/assets/js'),
    },
  };
  return config;
};

export default webpackconfig;

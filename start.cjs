require('@babel/register')({
  presets: ['@babel/preset-env'],
  extensions: ['.js'],
  ignore: [/node_modules/],
});

module.exports = require('./server.js');

const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Enable tree shaking and minification
config.transformer.minifierConfig = {
  compress: {
    drop_console: true, // Remove console.logs in production
    dead_code: true,
    unused: true,
  },
};

// Optimize caching
config.resetCache = false;

module.exports = config;

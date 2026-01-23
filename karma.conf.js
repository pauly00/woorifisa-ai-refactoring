module.exports = function(config) {
    config.set({
      frameworks: ['qunit'],
      files: [
        'node_modules/jquery/dist/jquery.min.js',
        'shim.js',             
        'accounting.js',
        'tests/qunit/methods.js'
      ],
      preprocessors: { 'accounting.js': ['coverage'] },
      reporters: ['progress', 'coverage'],
      coverageReporter: { type : 'html', dir : 'coverage/' },
      browsers: ['ChromeHeadless'],
      singleRun: true
    })
  }
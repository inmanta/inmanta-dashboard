module.exports = function(config){
  config.set({

    basePath : './',

    files : [
      'app/bower_components/angular/angular.js',
      'app/bower_components/angular-ui-router/release/angular-ui-router.js',
      'app/bower_components/angular-mocks/angular-mocks.js',
      'app/bower_components/angular-bootstrap/ui-bootstrap-tpls.js',
      'app/bower_components/ng-table/dist/ng-table.js',
      'app/bower_components/angular-dialog-service/dist/dialogs.js',
      'app/bower_components/d3/d3.js',
      'app/bower_components/angular-sanitize/angular-sanitize.js',
      'app/bower_components/karma-read-json/karma-read-json.js',
      'app/components/**/*.js',
      'app/views/**/*.js', 
       {pattern: 'testdata/*.json', included: false}
    ],

    autoWatch : true,

    frameworks: ['jasmine'],

    browsers : ['Chrome'],

    plugins : [
            'karma-chrome-launcher',
            'karma-firefox-launcher',
            'karma-jasmine',
            'karma-junit-reporter'
            ],

    junitReporter : {
      outputFile: 'test_out/unit.xml',
      suite: 'unit'
    }

  });
};

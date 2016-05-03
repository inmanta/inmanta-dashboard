module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    concat: {
        options : {
            sourceMap :true
        },
        js: {
            src: ['app/app.js','app/components/**/*.js','app/partials/**/*.js','app/views/**/*.js','build/templates.js'],
            //dest: './build/cat/app.js'
            dest: './build/cat/app.js'

        }
    },
    uglify: {
      options: {
        sourceMap : true,
        sourceMapIncludeSources : true,
        sourceMapIn : './build/cat/app.js.map',
        banner: '/*! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */\n'
      },
      build: {
        src: './build/cat/app.js',
        dest: './app/app.min.js'
      }
    },
    watch:{
        scripts: {
            files: ['app/**/*.js','!app/*.min.js'],
            tasks: ['package']
        },
        htmls: {
            files:  ['**/*.html'],
            tasks: ['packhtml']
        }
    },
    
    ngAnnotate: {
        app: {
            files: [{
                expand: true,
                src:['app/app.js','app/components/**/*.js','app/partials/**/*.js','app/views/**/*.js'],
                dest: 'annot/'        
            }]
        }      
    },
    ngtemplates:  {     
        ImperaApp:        {
                src: ['**/*.html','!index.html','!bower_components/**/*.html'],
                dest: 'build/templates.js',
                cwd: 'app'
        },
        options :{
            htmlmin: {
                collapseBooleanAttributes:      true,
                collapseWhitespace:             true,
                removeAttributeQuotes:          true,
                removeComments:                 true, // Only if you don't use comment directives! 
                removeEmptyAttributes:          true,
                removeRedundantAttributes:      true,
                removeScriptTypeAttributes:     true,
                removeStyleLinkTypeAttributes:  true
            }
            }
  }
  });

  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-ng-annotate');
  grunt.loadNpmTasks('grunt-angular-templates');

  // Default task(s).
  grunt.registerTask('packhtml', ['ngtemplates','package']);
  grunt.registerTask('package', ['concat','uglify']);
  grunt.registerTask('default', ['packhtml','watch']);

};

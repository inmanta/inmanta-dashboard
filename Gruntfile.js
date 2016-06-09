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
  },
   copy: {
      dist: {
        files: [{
          expand: true,
          dot: true,
          cwd: 'app',
          dest: 'dist',
          src: [
            '*.{ico,png,txt}',
            'index.html',
            'img/*',
            'config.js'
          ]
        },{
          expand: true,
          cwd: 'app/bower_components/bootstrap/fonts',
          src: '*',
          dest: 'dist/fonts'
        }]
      }
      
    },
  useminPrepare: {
    html: 'app/index.html',
    options: {
      root: 'app',
      dest: 'dist'
    }
  },
  usemin: {
      html: 'dist/index.html',
      options: {
        root: 'app',
        dest: 'dist'
      }
  },
  compress: {
    main: {
        options: {
          archive: 'dist.tgz',
          mode:'tgz'
        },
        src: ['dist/**']
    }
  }

  });

  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-usemin');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-cssmin');
  grunt.loadNpmTasks('grunt-filerev');
  grunt.loadNpmTasks('grunt-ng-annotate');
  grunt.loadNpmTasks('grunt-angular-templates');
  grunt.loadNpmTasks('grunt-contrib-compress');

  // Default task(s).
  grunt.registerTask('packhtml', ['ngtemplates','package']);
  grunt.registerTask('package', ['concat']);
  grunt.registerTask('default', ['packhtml','package','watch']);
  
  grunt.registerTask('dist', [
  'packhtml',
  'useminPrepare',
  'copy:dist',
  'concat:generated',
  'cssmin:generated',
  'uglify:generated',
//  'filerev',
  'usemin',
  'compress'
  ]);

};

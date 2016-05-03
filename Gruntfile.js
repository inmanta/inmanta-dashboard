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
            tasks: ['package','uglify']
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
                src: ['**/*.html','!index.html'],
                dest: 'build/templates.js',
                cwd: 'app'
        }
  }
  });

  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-ng-annotate');
  grunt.loadNpmTasks('grunt-angular-templates');

  // Default task(s).
  grunt.registerTask('package', ['ngtemplates','concat','uglify']);
  grunt.registerTask('default', ['package','watch']);

};

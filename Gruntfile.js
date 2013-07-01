var execSync = require('execSync').exec;
var gitSha = function(){
  var tags = execSync('git describe --tags'),
      sha  = execSync('git log -n 1 --format="%h (%ci)"');

  return "// " + tags.stdout +
         "// " + sha.stdout;
};

module.exports = function(grunt) {
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),

    neuter: {
      options: {
        filepathTransform: function(filepath) {
          filepath.replace('ember-model', 'ember-model/lib');
          return 'packages/' + filepath.replace('ember-model', 'ember-model/lib');
        }
      },
      'dist/ember-model.js': 'packages/ember-model/lib/main.js'
    },

    uglify: {
      production: {
        src: 'dist/ember-model.prod.js',
        dest: 'dist/ember-model.min.js'
      }
    },

    jshint: {
      options: {
        jshintrc: '.jshintrc'
      },
      all: ['Gruntfile.js', 'packages/ember-model/**/*.js']
    },

    qunit: {
      all: ['tests/**/*.html']
    },

    build_test_runner_file: {
      all: ['packages/ember-model/tests/**/*_test.js']
    },

    banner: {
      options: {
        license: 'banner.txt'
      },

      production: {
        src : 'dist/ember-model.prod.js',
      },
      minified: {
        src: 'dist/ember-model.min.js'
      }
    },

    strip : {
      production : {
        src : 'dist/ember-model.prod.js',
        options : {
          inline: true,
          nodes : ['Ember.assert']
        }
      }
    }

  });

  // Load the plugins that provide tasks
  require('matchdep').filterDev('grunt-*').forEach(grunt.loadNpmTasks);
  grunt.task.renameTask('release', '_release');

  grunt.registerTask('release', 'tag a new release', function(type){
    type = type || 'patch';
    var options = this.options({
        file: 'bower.json',
        npm: false,
        add: 'ember-model.js'
    });

    grunt.task.run('build');
    grunt.file.copy('dist/ember-model.js', 'ember-model.js');

    grunt.task.run('_release:'+type, options);
  });

  grunt.registerMultiTask('banner', 'Append a banner to production', function(){
    var options = this.options(),
        license = grunt.file.read(options.license),
        gitInfo = gitSha(),
        code = grunt.file.read(this.file.src);

    grunt.file.write(this.file.src, [license, gitInfo, code].join("\n"));
  });

  grunt.registerTask('build-prod', function(){
    grunt.file.copy('dist/ember-model.js', 'dist/ember-model.prod.js');
    grunt.task.run('strip:production');
    grunt.task.run('uglify:production');
    grunt.task.run('banner');
  });
   
  grunt.registerMultiTask('build_test_runner_file', 'Creates a test runner file.', function(){
    var tmpl = grunt.file.read('tests/runner.html.tmpl');
    var renderingContext = {
      data: {
        files: this.filesSrc
      }
    };
    grunt.file.write('tests/runner.html', grunt.template.process(tmpl, renderingContext));
  });
  
  grunt.registerTask('build', ['jshint', 'neuter', 'build-prod']);
  grunt.registerTask('test', ['jshint', 'neuter', 'build_test_runner_file', 'qunit']);
  grunt.registerTask('default', ['build']);

};
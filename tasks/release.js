module.exports = function(grunt){
  grunt.registerTask('release', 'tag a new release', function(type){
    type = type || 'patch';

    grunt.task.run('build');
    grunt.task.run('copy:release');
    grunt.task.run('_release:'+type);
  });
};

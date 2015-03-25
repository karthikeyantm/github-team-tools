var gulp = require('gulp'),
    AddAllOrgResourcesToTeam = require('./lib/github-team-tools'),
    config = require('./config'),
    addAllOrgResourcesToTeam = new AddAllOrgResourcesToTeam(config),
    dryRun = (process.argv && process.argv.indexOf('--dry-run') !== -1);

gulp.task('default', function() {
  console.log('Please use gulp add-repos, add-users, remove-users');
});

gulp.task('add-repos', function(done) {
  addAllOrgResourcesToTeam.addMisingRepos(function () {
    done();
  }, dryRun);
});

gulp.task('add-users', function(done) {
  addAllOrgResourcesToTeam.addMisingUsers(function () {
    done();
  }, dryRun);
});

gulp.task('remove-users', function(done) {
  addAllOrgResourcesToTeam.removeUsersOnlyInReadOnly(function () {
    done();
  }, dryRun);
});

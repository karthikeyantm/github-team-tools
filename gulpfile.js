var gulp = require('gulp'),
    AddAllOrgResourcesToTeam = require('./lib/github-team-tools'),
    config = require('./config'),
    addAllOrgResourcesToTeam = new AddAllOrgResourcesToTeam(config),
    argv = require('yargs').argv,
    dryRun = (argv['dry-run'] || false);

gulp.task('default', function() {
  console.log('Please use gulp add-repos, add-user(s), remove-user(s)');
});

gulp.task('add-repos', function(done) {
  addAllOrgResourcesToTeam.addMissingRepos(function () {
    done();
  }, dryRun);
});

gulp.task('add-repo', function(done) {
  var repo = argv.repo || null;
  if (repo) {
    addAllOrgResourcesToTeam.addRepo(repo, function () {
      done();
    });
  } else {
    console.log('Please specify repo with --repo <repo>');
  }
});

gulp.task('add-users', function(done) {
  addAllOrgResourcesToTeam.addMissingUsers(function () {
    done();
  }, dryRun);
});

gulp.task('add-user', function(done) {
  var user = argv.user || null;
  if (user) {
    addAllOrgResourcesToTeam.addUser(user, function () {
      done();
    });
  } else {
    console.log('Please specify user with --user <username>');
  }
});

gulp.task('remove-users', function(done) {
  addAllOrgResourcesToTeam.removeUsersOnlyInReadOnly(function () {
    done();
  }, dryRun);
});

gulp.task('remove-user', function(done) {
  var user = argv.user || null;
  if (user) {
    addAllOrgResourcesToTeam.removeUserOnlyInReadOnly(user, function () {
      done();
    });
  } else {
    console.log('Please specify user with --user <username>');
  }
});

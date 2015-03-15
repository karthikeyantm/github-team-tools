var AddAllOrgResourcesToTeam = require('./lib/github-team-tools'),
    config = require('./config'),
    dryRun = (process.argv && process.argv.indexOf('--dry-run') !== -1);

var addAllOrgResourcesToTeam = new AddAllOrgResourcesToTeam(config);
addAllOrgResourcesToTeam.addMisingRepos(function () {
  console.log('done');
}, dryRun);

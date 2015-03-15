var AddAllOrgResourcesToTeam = require('./lib/add-all-org-resources-to-team'),
    config = require('./config'),
    dryRun = (process.argv && process.argv.indexOf('--dry-run') !== -1);

var addAllOrgResourcesToTeam = new AddAllOrgResourcesToTeam(config);
addAllOrgResourcesToTeam.removeUsersOnlyInReadOnly(function () {
  console.log('done');
}, dryRun);

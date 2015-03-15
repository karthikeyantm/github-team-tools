var AddAllOrgResourcesToTeam = require('./lib/add-all-org-resources-to-team'),
    config = require('./config');

var addAllOrgResourcesToTeam = new AddAllOrgResourcesToTeam(config);
addAllOrgResourcesToTeam.removeUsersOnlyInReadOnly();

var AddAllOrgResourcesToTeam = require('./lib/add-all-org-resources-to-team'),
    config = {
      token: process.env.GITHUB_TOKEN,
      orgName: process.env.GITHUB_ORG_NAME,
      readOnlyTeamId: process.env.GITHUB_TEAM_ID
    };

var addAllOrgResourcesToTeam = new AddAllOrgResourcesToTeam(config);
addAllOrgResourcesToTeam.addMisingRepos();
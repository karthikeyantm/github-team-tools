'use strict';

module.exports = {
  token: process.env.GITHUB_TOKEN,
  orgName: process.env.GITHUB_ORG_NAME,
  readOnlyTeamId: process.env.GITHUB_TEAM_ID,
  blacklist: {
    repos: [],
    members: []
  }
};

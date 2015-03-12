'use strict';

/**
 * github-team-tools v0.0.1
 */
var github = require('octonode'),
    config = {},
    client,
    ghorg,
    ghteam;

/**
 * Returns a list of different indexs between arrays
 *
 * @example [4, 5].diff[5, 6] // [4, 6]
 * @param {array} array to diff on
 */
Array.prototype.diff = function(a) {
  return this.filter(function(i) {return a.indexOf(i) < 0;});
};

/**
 * Constructor
 *
 * @example var addAllOrgResourcesToTeam = new AddAllOrgResourcesToTeam({token: 'foo', orgName: 'bar', readOnlyTeamId: 123})
 * @param {object} usrConfig
 */
function AddAllOrgResourcesToTeam(usrConfig) {
  config = usrConfig;
  client = github.client(config.token);
  ghorg = client.org(config.orgName);
  ghteam = client.team(config.readOnlyTeamId);

  // Debug
  client.get('/user', {}, function (err, status, body, headers) {
    console.log('logged in as', body.login);
  });

  client.limit(function (err, left, max) {
    console.log('rate limit', {
      left: left, // 4999
      max: max // 5000
    });
  });  
}

/**
 * List all the repos/users in an org or team
 *
 * @param {octonode resource} eg ghorg or ghteam
 * @param {string} type repos or members
 * @param {function} callback when done
 * @param {number} page (for recursive use)
 */
var resourceData;
var getGhResourceData = function(resource, type, callback, page) {
  page = page || 1;

  if (page === 1) {
    resourceData = {};
  }

  resource[type](page, function(err, data, headers) {
    console.log('on page', page);

    data.map(function(rd) {
      if (type === 'repos') {
        // Only add if its a repo owned by the org
        if (rd.full_name.indexOf(config.orgName + '/') === 0) {        
          resourceData[rd.id] = rd.name;
        }
      } else if (type === 'members') {
        resourceData[rd.id] = rd.login;
      } else {
        throw('I dont know how to handle: ' + type);
      }
    });

    var nextPage = /page=([0-9]+)[^"]*"next"/.exec(headers.link);
    if (nextPage && nextPage[1]) {
      getGhResourceData(resource, type, callback, nextPage[1]);
    } else {
      callback(resourceData);
    }
  });
};

/**
 * Recursive loop through all repos and add to team
 *
 * @param {array} repoKeys
 * @param {array} allRepos
 */
var addTeamRepos = function(repoKeys, allRepos) {
  var repoKey = repoKeys.pop(),
      repo = allRepos[repoKey];

  if (repo) {
    ghorg.addTeamRepo(config.readOnlyTeamId, repo, function() {
      console.log('added', repo);
      if (repoKeys.length > 0) {
        addTeamRepos(repoKeys, allRepos);
      }
    });
  }
};

/**
 * Recursive loop through all users and add to team
 *
 * @param {array} userKeys
 * @param {array} allUsers
 */
var addTeamUsers = function(userKeys, allUsers) {
  var userKey = userKeys.pop(),
      user = allUsers[userKey];

  if (user) {
    ghteam.addUser(user, function() {
      console.log('added', user);
      if (userKey.length > 0) {
        addTeamRepos(userKeys, allUsers);
      }
    });
  }
};

/**
 * Compute missing read only resources
 *
 * @param {object} readOnlyResources
 * @param {object} allResources
 */
var getMissingKeys = function(readOnlyResources, allResources) {
  var readOnlyKeys = Object.keys(readOnlyResources),
      allKeys = Object.keys(allResources),
      countReadOnly = readOnlyKeys.length,
      countAll =  allKeys.length;

  console.log('readOnly count', countReadOnly);
  console.log('all count', countAll);
  console.log('diff', countAll - countReadOnly);

  // Get missing
  var missingKeys = allKeys.diff(readOnlyKeys);
  console.log('adding', missingKeys.length);
  
  return missingKeys;
};

/**
 * Loop through & get read only team repos and all org repos and add any missing repos
 */
AddAllOrgResourcesToTeam.prototype.addMisingRepos = function () {
  getGhResourceData(ghteam, 'repos', function (readOnlyRepos) {

    getGhResourceData(ghorg, 'repos', function (allOrgRepos) {    
      var missingRepoKeys = getMissingKeys(readOnlyRepos, allOrgRepos);
      addTeamRepos(missingRepoKeys, allOrgRepos);
    });
  });
};

/**
 * Loop through & get read only team users and all org users and add any missing users
 */
AddAllOrgResourcesToTeam.prototype.addMisingUsers = function () {
  getGhResourceData(ghteam, 'members', function (readOnlyUsers) {

    getGhResourceData(ghorg, 'members', function (allOrgUsers) {
      var missingUserKeys = getMissingKeys(readOnlyUsers, allOrgUsers);
      addTeamUsers(missingUserKeys, allOrgUsers);
    });
  });
};

module.exports = AddAllOrgResourcesToTeam;
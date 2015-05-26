'use strict';

/**
 * github-team-tools v0.0.7
 */
var github = require('octonode'),
    Logger = require('bunyan'),
    Stream = require('stream'),
    config = {},
    log,
    client,
    ghorg,
    ghteam;

/**
 * Constructor
 *
 * @example var addAllOrgResourcesToTeam = new AddAllOrgResourcesToTeam({token: 'foo', orgName: 'bar', readOnlyTeamId: 123})
 * @param {object} usrConfig
 */
function AddAllOrgResourcesToTeam(usrConfig) {
  config = usrConfig;

  var loggerStream = new Stream();
  loggerStream.writable = true;

  loggerStream.write = function(obj) {
     // pretty-printing your message
     console.log(obj.msg);
  };

  log = config && config.logger || new Logger({
     name: 'github-team-tools',
     streams: [{
        type: "raw",
        stream: loggerStream,
     }],
     serializers: {
        err: Logger.stdSerializers.err,
        req: Logger.stdSerializers.req,
        res: Logger.stdSerializers.res,
     },
  });

  client = github.client(config.token);
  ghorg = client.org(config.orgName);
  ghteam = client.team(config.readOnlyTeamId);


  // Debug
  client.get('/user', {}, function (err, status, body, headers) {
    if (err) {
      throw(err);
    }
    log.info('logged in as', body.login);
  });

  client.limit(function (err, left, max) {
    log.info('rate limit', {
      left: left, // 4999
      max: max // 5000
    });
  });
}

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
    log.info('on page', page);

    data.map(function(rd) {
      switch (type) {
        case 'repos':
          // Only add if its a repo owned by the org & not blacklisted
          var repoOwnedByOrg = (rd.full_name.toLowerCase().indexOf(config.orgName.toLowerCase() + '/') === 0);
          if (repoOwnedByOrg && !isRepoBlacklisted(rd.name)) {
            resourceData[rd.id] = rd.name;
          }
          break;
        case 'members':
          if (!isMemberBlacklisted(rd.login)) {
            resourceData[rd.id] = rd.login;
          }
          break;
        case 'teams':
          resourceData[rd.id] = rd.slug;
          break;
        default:
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
 * Returns an array of all members in the array of teams
 *
 * @param {array} teamKeys - teams keys
 * @param {object} team
 * @param {function} callback
 * @param {array} members
 * @callback
 */
var getAllMembersForTeams = function(teamKeys, teams, callback, members) {
  var members = members || [],
      teamKey = teamKeys.pop(),
      team = teams[teamKey];

  if (!team) {
     callback(members);
   } else {
    var teamClient = client.team(teamKey);
    getGhResourceData(teamClient, 'members', function (teamMembers) {
      log.info('got members for', team);
      Object.keys(teamMembers).forEach(function (key) {
        members.push(teamMembers[key]);
      });
      getAllMembersForTeams(teamKeys, teams, callback, members);
    });
  }
};

/**
 * Recursive loop through all repos and add to team
 *
 * @param {array} repoKeys
 * @param {array} allRepos
 * @param {function} callback
 */
var addTeamRepos = function(repoKeys, allRepos, callback) {
  var repoKey = repoKeys.pop(),
      repo = allRepos[repoKey];

  if (repo) {
    ghorg.addTeamRepo(config.readOnlyTeamId, repo, function() {
      log.info('added', repo);
      if (repoKeys.length > 0) {
        addTeamRepos(repoKeys, allRepos, callback);
      } else {
        callback();
      }
    });
  } else {
    callback();
  }
};

/**
 * Recursive loop through all users and add to team
 *
 * @param {array} userKeys
 * @param {array} allUsers
 * @param {function} callback
 */
var addTeamUsers = function(userKeys, allUsers, callback) {
  var userKey = userKeys.pop(),
      user = allUsers[userKey];

  if (user) {
    ghteam.addUser(user, function() {
      log.info('added', user);
      if (userKey.length > 0) {
        addTeamUsers(userKeys, allUsers, callback);
      } else {
        callback();
      }
    });
  } else {
    callback();
  }
};

/**
 * Removes an array of users from the read only team
 *
 * @param {array} users
 * @param {function} callback
 * @callback
 */
var removeUsers = function(usersToRemove, callback) {
  if (usersToRemove.length) {
    var userToRemove = usersToRemove.pop();
    ghteam.removeUser(userToRemove, function () {
      log.info('removed user', userToRemove);
      removeUsers(usersToRemove, callback);
    });
  } else {
    callback();
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

  log.info('readOnly count', countReadOnly);
  log.info('all count', countAll);
  log.info('diff', countAll - countReadOnly);

  // Get missing
  var missingKeys = allKeys.diff(readOnlyKeys);
  log.info('adding', missingKeys.length);

  return missingKeys;
};

/**
 * Check if a repo is on the blacklist
 *
 * @param {string} repo
 */
var isRepoBlacklisted = function(repo) {
  return (config.blacklist.repos.indexOf(repo) > -1);
};

/**
 * Check if a member is on the blacklist
 *
 * @param {string} user
 */
var isMemberBlacklisted = function(user) {
  return (config.blacklist.members.indexOf(user) > -1);
};

/**
 * Add a single repo to the read only team
 *
 * @param {string} repo
 * @param {function} callback
 */
AddAllOrgResourcesToTeam.prototype.addRepo = function (repo, callback) {
  if (isRepoBlacklisted(repo)) {
    log.info('repo blacklisted', repo);
    callback();
    return;
  }

  ghorg.addTeamRepo(config.readOnlyTeamId, repo, function() {
    log.info('added', repo);
    callback();
  });
};

/**
 * Loop through & get read only team repos and all org repos and add any missing repos
 *
 * @param {function} callback
 * @param {boolean} dryRun
 */
AddAllOrgResourcesToTeam.prototype.addMissingRepos = function (callback, dryRun) {
  getGhResourceData(ghteam, 'repos', function (readOnlyRepos) {

    getGhResourceData(ghorg, 'repos', function (allOrgRepos) {
      var missingRepoKeys = getMissingKeys(readOnlyRepos, allOrgRepos);
      if (!dryRun) {
        addTeamRepos(missingRepoKeys, allOrgRepos, callback);
      } else {
        var repos = [];
        missingRepoKeys.forEach(function (repoKey) {
          repos.push(allOrgRepos[repoKey]);
        });
        log.info('Not adding repos in dry-run mode:', repos);
        callback();
      }
    });
  });
};

/**
 * Add a single user to the read only team
 *
 * @param {string} user
 * @param {function} callback
 */
AddAllOrgResourcesToTeam.prototype.addUser = function (user, callback) {
  if (isMemberBlacklisted(user)) {
    log.info('user blacklisted', user);
    callback();
    return;
  }

  ghteam.addUser(user, function() {
    log.info('added', user);
    callback();
  });
};

/**
 * Loop through & get read only team users and all org users and add any missing users
 *
 * @param {function} callback
 * @param {boolean} dryRun
 */
AddAllOrgResourcesToTeam.prototype.addMissingUsers = function (callback, dryRun) {
  getGhResourceData(ghteam, 'members', function (readOnlyUsers) {

    getGhResourceData(ghorg, 'members', function (allOrgUsers) {
      var missingUserKeys = getMissingKeys(readOnlyUsers, allOrgUsers);
      if (!dryRun) {
        addTeamUsers(missingUserKeys, allOrgUsers, callback);
      } else {
        var users = [];
        missingUserKeys.forEach(function (userKey) {
          users.push(allOrgUsers[userKey]);
        });
        log.info('Not adding users in dry-run mode:', users);
        callback();
      }
    });
  });
};

/**
 * Removes users that are only in the read only group
 *
 * @param {function} callback
 * @param {boolean} dryRun
 */
AddAllOrgResourcesToTeam.prototype.removeUsersOnlyInReadOnly = function (callback, dryRun) {
  // Get all teams users (except read only team)
  // Get teams
  getGhResourceData(ghorg, 'teams', function (allOrgTeams) {
    // Remove read only team
    delete allOrgTeams[config.readOnlyTeamId];

    // Get users
    getAllMembersForTeams(Object.keys(allOrgTeams), allOrgTeams, function (nonReadOnlyUsers) {
      // Get read only team users
      getGhResourceData(ghteam, 'members', function (readOnlyUsers) {
        var onlyInReadTeam = [];
        Object.keys(readOnlyUsers).forEach(function (key) {
            var user = readOnlyUsers[key];
            if (nonReadOnlyUsers.indexOf(user) === -1) {
              onlyInReadTeam.push(user);
            }
        });

        if (!dryRun) {
          removeUsers(onlyInReadTeam, callback);
        } else {
          log.info('Not removing users in dry-run mode:', onlyInReadTeam);
          callback();
        }
      });
    });
  });
};

/**
 * Remove a single user from read only team only if they are not in any other team
 *
 * @param {string} user
 * @param {function} callback
 */
AddAllOrgResourcesToTeam.prototype.removeUserOnlyInReadOnly = function (user, callback) {
  if (isMemberBlacklisted(user)) {
    log.info('user blacklisted', user);
    callback();
    return;
  }

  // Get all teams users (except read only team)
  // Get teams
  getGhResourceData(ghorg, 'teams', function (allOrgTeams) {
    // Remove read only team
    delete allOrgTeams[config.readOnlyTeamId];

    // Get users
    getAllMembersForTeams(Object.keys(allOrgTeams), allOrgTeams, function (nonReadOnlyUsers) {
        if (nonReadOnlyUsers.indexOf(user) === -1) {
          log.info('User is not in any other teams, remove from read only team');

          ghteam.removeUser(user, function () {
            log.info('removed user', user);
            callback();
          });
        } else {
          log.info('User is in another team, not removing from read only team');
          callback();
        }
    });
  });
};

module.exports = AddAllOrgResourcesToTeam;

GitHub Team Tools v0.0.5
========================

Adds all GitHub organization members & repos into a (read only) team.  
Note you need to be a member of the GitHub organizations Owners team to be able to run this.

# Usage
```bash
npm install
```

If behind a proxy make sure to export `HTTP_PROXY`

### CLI setup
```bash
export GITHUB_TOKEN="your-github-app-token"
export GITHUB_ORG_NAME="my-org"
export GITHUB_TEAM_ID="1234567"
```

### node setup
```javascript
var GhTeamTools = require('github-team-tools'),
    config = {
      token: process.env.GITHUB_TOKEN,
      orgName: process.env.GITHUB_ORG_NAME,
      readOnlyTeamId: process.env.GITHUB_TEAM_ID,
    };

var ghTeamTools = new GhTeamTools(config),
    dryRun = true;
```

## Add all org repos into a team
### CLI
```bash
gulp add-repos --dry-run
```

### node
```javascript
ghTeamTools.addMissingRepos(function () {
    console.log('done');
}, dryRun);
```

## Add all org members into a team

### CLI
```bash
gulp add-users --dry-run
```

### node
```javascript
ghTeamTools.addMissingUsers(function () {
    console.log('done');
}, dryRun);
```

## Add a member into a team

### CLI
```bash
gulp add-user --user <username>
```

### node
```javascript
ghTeamTools.addUser('<username>', function () {
    console.log('done');
});
```

## Remove users that are only found in a team

### CLI
```bash
gulp remove-users --dry-run
```

### node
```javascript
ghTeamTools.removeUsersOnlyInReadOnly(function () {
    console.log('done');
}, dryRun);
```

## Only remove a user from a team if they are not found in any other teams

### CLI
```bash
gulp remove-user --user <username>
```

### node
```javascript
ghTeamTools.removeUserOnlyInReadOnly('<username>', function () {
    console.log('done');
});
```

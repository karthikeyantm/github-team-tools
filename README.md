GitHub Team Tools v0.0.4
========================

Adds all GitHub organization members & repos into a (read only) team.  
Note you need to be a member of the GitHub organizations Owners team to be able to run this.

# Usage
```bash
npm install
```

If behind a proxy make sure to export `HTTP_PROXY`

## Add all org repos into a team
### CLI
```bash
export GITHUB_TOKEN="your-github-app-token"
export GITHUB_ORG_NAME="my-org"
export GITHUB_TEAM_ID="1234567"
```

```bash
gulp add-repos --dry-run
```

### node
```javascript
var GhTeamTools = require('github-team-tools'),
    config = {
      token: 'your-github-app-token',
      orgName: 'my-org',
      readOnlyTeamId: '1234567'
    };

var ghTeamTools = new GhTeamTools(config),
    dryRun = true;
ghTeamTools.addMisingRepos(function () {
    console.log('done');
}, dryRun);
```

## Add all org members into a team

### CLI
```bash
gulp add-users --dry-run
```

### node
As above, but change the last command to:

```javascript
ghTeamTools.addMisingUsers(function () {
    console.log('done');
}, dryRun);
```

## Remove users that are only found in the read only team

### CLI
```bash
gulp remove-users --dry-run
```

### node
As above, but change the last command to:

```javascript
ghTeamTools.removeUsersOnlyInReadOnly(function () {
    console.log('done');
}, dryRun);
```

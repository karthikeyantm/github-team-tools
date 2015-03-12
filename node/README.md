GitHub Team Tools v0.0.1
========================

Adds all GitHub organization members & repos into a (read only) team.

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
node add-all-org-repos-to-team.js
```

### node
```javascript
var GhTeamTools = require('github-team-tools'),
    config = {
      token: 'your-github-app-token',
      orgName: 'my-org',
      readOnlyTeamId: '1234567'
    };

var ghTeamTools = new GhTeamTools(config);
ghTeamTools.addMisingRepos();
```

## Add all org members into a team
As above, but change the last line to:

### CLI
```bash
node add-all-org-users-to-team.js
```

### node
```javascript
ghTeamTools.addMisingUsers();
```
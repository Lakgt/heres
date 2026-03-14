# Heres CRE

This is the active Chainlink CRE project used by Heres.

## Structure

- `project.yaml` - CRE project settings
- `.env` - CRE deploy wallet secret
- `cre-delivery/` - active workflow

## Workflow

The active workflow is:

- `cre-delivery`

It receives delivery requests from the Heres app and posts status callbacks back to the production app.

## Deploy

Run from this folder:

```powershell
cre workflow deploy .\cre-delivery --target production-settings --yes
```

After deploy, take the workflow endpoint and set it as:

- `CHAINLINK_CRE_WEBHOOK_URL`

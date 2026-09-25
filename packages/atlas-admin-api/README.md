# @mongodb-js/atlas-admin-api

Atlas Admin API client for Compass. Request/response types come from the
published OpenAPI spec.

## Versioning

The Atlas Admin API is versioned per resource, not as a whole: each endpoint
has its own set of dated versions (`2023-01-01`, `2024-08-05`, ...), and a new
version of an endpoint is only released when it has a breaking change. Clients
pick a version per request with the `Accept` header:

```
Accept: application/vnd.atlas.2025-03-12+json
```

Compass sends one default version for every call, `ATLAS_ADMIN_API_DEFAULT_VERSION`
in `src/version.ts`; Atlas answers with the newest version of that endpoint that is
not newer than the requested date. Deprecated versions keep working for a
support window before they are removed, so bumping the default is a deliberate
change that should be reviewed against the changelog. See the
[Versioned Atlas Administration API overview](https://www.mongodb.com/docs/atlas/api/versioned-api-overview/)
and the [API changelog](https://www.mongodb.com/docs/atlas/reference/api-resources-spec/changelog/).

## Generated types

`openapi/v2.d.ts` and `openapi/default-version.d.ts` are generated and
committed; see [`openapi/README.md`](openapi/README.md) for how to use and
regenerate them.

Adding a call to a new endpoint also requires listing its path in
`packages/atlas-service/src/atlas-admin-api-auth-endpoints.ts`, otherwise the
Electron main process won't attach the bearer token.

# Generated — do not edit

`v2.d.ts` (all operations, all stable resource versions) and
`default-version.d.ts` (for each operation, the version a request without an
explicit `version` gets: the newest one not newer than
`ATLAS_ADMIN_API_DEFAULT_VERSION`) are produced by
`scripts/generate-openapi-types.mts` from
[mongodb/openapi](https://github.com/mongodb/openapi) `openapi/v2.json`.

Regenerate with:

```sh
npm run update-openapi-types
```

Use `Response<'getGroupCluster'>` for the default version's response body, or
`Response<'getGroupCluster', '2023-02-01'>` to pin a version that operation
supports; unsupported versions are a compile error. Operations are keyed by the
spec's raw `operationId` (e.g. `listAlertConfigMatcherFieldNames`), not the
`x-xgen-operation-id-override` name shown in the docs and SDKs.

## Working against an unpublished endpoint

`main` of mongodb/openapi tracks what is deployed to prod; `dev`/`qa`/`stage`
branches track those environments (refreshed hourly). For an endpoint that only
exists on your MMS branch, generate the spec locally and point the script at it:

```sh
# in the mms checkout
bazel run //server:mms-openapi   # -> server/openapi/services/openapi-mms.json
# in compass
npm run update-openapi-types -- --spec ~/mms/server/openapi/services/openapi-mms.json
```

`--spec` also accepts a URL (e.g. the `dev` branch or an Evergreen
`OPENAPI_GENERATE_SPECS` artifact), as does the `ATLAS_OPENAPI_SPEC` env var.
Don't commit types generated from an unpublished spec.

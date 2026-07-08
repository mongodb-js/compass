// Whitelist of Atlas Admin API endpoints that require authentication (and that Compass actively uses).

// Source: https://www.mongodb.com/docs/api/doc/atlas-admin-api-v2/

const groupId = /^([a-f0-9]{24})$/;
const clusterName = /^[a-zA-Z0-9][a-zA-Z0-9-]*$/;

export const ATLAS_ADMIN_API_AUTH_ENDPOINTS = [
  '/api/atlas/v2/clusters',
  new RegExp(`/api/atlas/v2/groups/${groupId.source}/clusters`),
  new RegExp(
    `/api/atlas/v2/groups/${groupId.source}/clusters/${clusterName.source}`
  ),
  new RegExp(`/api/atlas/v2/groups/${groupId.source}/accessList`),
];

import type { SimpleEvalCase } from '../assistant.eval';

const oidcAuthCases: SimpleEvalCase[] = [
  {
    input:
      'OIDC auth: authenticated with IdP but Compass says Authentication ' +
      'failed on server',
    expected: `You likely authenticated with your identity provider, but the MongoDB
server rejected the request due to configuration issues. Check the Compass
log. Try connecting with mongosh. Collect tokens using: mongosh
--oidcDumpTokens <connection string>. Share logs, the dump output, timestamps,
and your Compass and mongosh versions with the cluster administrator to fix
the server configuration.`,
    expectedSources: [
      'https://www.mongodb.com/docs/compass/current/troubleshooting/logs/',
    ],
  },
  {
    input: 'Compass hangs then browser shows 400 Bad Request during OIDC login',
    expected: `This suggests a mismatch between IdP configuration and MongoDB server
OIDC settings. Check the Compass log, test connectivity with mongosh, and
contact the cluster administrator with logs, times, and versions to correct
the IdP and server configuration.`,
    expectedSources: [
      'https://www.mongodb.com/docs/compass/current/troubleshooting/logs/',
    ],
  },
];

export default oidcAuthCases;

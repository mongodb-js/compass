import type { SimpleEvalCase } from '../assistant.eval';

const connectionErrorCases: SimpleEvalCase[] = [
  {
    input:
      'Connection failed in Compass: Authentication failed using mongodb+srv. ' +
      'What should I check?',
    expected: `Start with the basics: verify username and password, confirm the
database user exists, and ensure the Authentication Database and mechanism
match your server setup. Check whether the selected auth mechanism is
supported. If this is an Atlas deployment, open the Connect modal for
connection details and code snippets. Review Compass logs for more specific
errors and, after you succeed, save the connection as a Favorite for next
time.`,
    expectedSources: [
      'https://www.mongodb.com/docs/compass/current/troubleshooting/connection-errors',
      'https://www.mongodb.com/docs/atlas/troubleshoot-connection',
      'https://www.mongodb.com/docs/atlas/compass-connection',
      'https://www.mongodb.com/docs/compass/current/connect',
      'https://www.mongodb.com/docs/compass/current/troubleshooting/logs/',
    ],
  },
  {
    input:
      'Compass shows querySrv ENOTFOUND for _mongodb._tcp.<cluster>. How do I ' +
      'fix DNS issues?',
    expected: `This indicates a DNS resolution problem. Double-check the cluster
address. From a terminal, run nslookup on the SRV record; if it fails, your
DNS may be blocking or unable to resolve the address. Ensure DNS TXT results
are allowed. Confirm the cluster still exists and isn't paused, verify your
internet connection, and check Compass logs for details.`,
    expectedSources: [
      'https://www.mongodb.com/docs/compass/current/troubleshooting/connection-errors',
      'https://www.mongodb.com/docs/atlas/troubleshoot-connection',
      'https://www.mongodb.com/docs/atlas/compass-connection',
      'https://www.mongodb.com/docs/compass/current/connect',
      'https://www.mongodb.com/docs/compass/current/troubleshooting/logs',
    ],
  },
  {
    input: 'connect ENETUNREACH when connecting from Compass',
    expected: `The destination network is unreachable. Check the Compass log, verify
your internet connection, and confirm the cluster address. Inspect VPN,
firewall, and network settings that may block outbound requests. Ensure the
target cluster exists and isn't paused. Logs often include details to narrow
down the failure.`,
    expectedSources: [
      'https://www.mongodb.com/docs/compass/current/troubleshooting/logs/',
      'https://www.mongodb.com/docs/compass/current/troubleshooting/connection-errors',
    ],
  },
  {
    input: 'querySrv ECONNREFUSED with mongodb+srv. Any workaround?',
    expected: `This may be a DNS or driver issue. In Atlas, find your legacy
connection string (mongodb://) and try connecting with it. If that works,
upgrade to the latest Compass and share what works vs. what fails with your
network admin. If it doesn't work, follow the next error's troubleshooting
steps as the message will likely change.`,
    expectedSources: [
      'https://www.mongodb.com/docs/compass/current/troubleshooting/connection-errors',
      'https://www.mongodb.com/docs/atlas/troubleshoot-connection',
      'https://www.mongodb.com/docs/atlas/compass-connection',
      'https://www.mongodb.com/docs/compass/current/connect',
      'https://www.mongodb.com/docs/compass/current/troubleshooting/logs',
    ],
  },
];

export default connectionErrorCases;

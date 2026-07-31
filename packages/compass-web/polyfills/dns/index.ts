import { query, lookupTxt } from 'dns-query';

const dohEndpoints = process.env.COMPASS_WEB_DOH_ENDPOINT ?? [
  'dns.google',
  'dns.cloudflare.com',
];

type SrvRecord = {
  priority?: number;
  weight?: number;
  port?: number;
  target?: string;
};

async function resolveSrv(hostname: string): Promise<SrvRecord[]> {
  const { answers } = await query(
    { question: { type: 'SRV', name: hostname } },
    { endpoints: dohEndpoints }
  );
  return (
    answers?.flatMap((answer) => {
      if (answer.type === 'SRV') {
        return { ...answer.data, name: answer.data.target };
      }
      return [];
    }) ?? []
  );
}

async function resolveTxt(hostname: string): Promise<string[][]> {
  const { entries } = await lookupTxt(hostname, { endpoints: dohEndpoints });
  return entries.map((entry) => [entry.data]);
}

/**
 * The MongoDB driver resolves SRV and TXT records exclusively through the
 * generic `dns.promises.resolve(address, rrtype)` entry point (see
 * `resolveSRVRecord` in the driver's connection_string.js), so this polyfill
 * only needs to implement `resolve` for those two record types.
 */
async function resolve(hostname: string, rrtype: 'SRV'): Promise<SrvRecord[]>;
async function resolve(hostname: string, rrtype: 'TXT'): Promise<string[][]>;
async function resolve(hostname: string, rrtype: string): Promise<unknown> {
  if (rrtype === 'SRV') {
    return await resolveSrv(hostname);
  }
  if (rrtype === 'TXT') {
    return await resolveTxt(hostname);
  }
  throw new Error(`Unsupported rrtype for dns.resolve polyfill: ${rrtype}`);
}

// Matches Node.js `dns.TIMEOUT`; the driver compares DNS error codes against it
// to decide whether to retry a resolution.
const TIMEOUT = 'ETIMEOUT';

const promises = { resolve };

export { promises, TIMEOUT };

export default {
  promises,
  TIMEOUT,
};

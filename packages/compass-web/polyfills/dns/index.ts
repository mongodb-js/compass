import { query, lookupTxt } from 'dns-query';
import { promisify } from 'util';

const dohEndpoints = process.env.COMPASS_WEB_DOH_ENDPOINT ?? [
  'dns.google',
  'dns.cloudflare.com',
];

export function resolveSrv(
  hostname: string,
  cb: (err: null | any, answers?: any[]) => void
) {
  query(
    { question: { type: 'SRV', name: hostname } },
    { endpoints: dohEndpoints }
  ).then(({ answers }) => {
    const res =
      answers?.flatMap((answer) => {
        if (answer.type === 'SRV') {
          return {
            ...answer.data,
            name: answer.data.target,
          };
        }
        return [];
      }) ?? [];
    cb(null, res);
  }, cb);
}
export function resolveTxt(
  hostname: string,
  cb: (err: null | any, answers?: string[][]) => void
) {
  lookupTxt(hostname, { endpoints: dohEndpoints }).then(({ entries }) => {
    const res = entries.map((entry) => {
      return [entry.data];
    });
    cb(null, res);
  }, cb);
}

export const promises = {
  resolveSrv: promisify(resolveSrv),
  resolveTxt: promisify(resolveTxt),
};

export default {
  resolveSrv,
  resolveTxt,
  promises,
};

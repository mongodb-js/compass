import { query, wellknown, lookupTxt } from 'dns-query';
import { promisify } from 'util';
export function resolveSrv(
  hostname: string,
  cb: (err: any | null, res?: any) => void
) {
  query(
    { question: { type: 'SRV', name: hostname } },
    { endpoints: wellknown.endpoints('doh') }
  ).then(({ answers }) => {
    cb(
      null,
      answers?.flatMap((answer) => {
        if (answer.type !== 'SRV') {
          return [];
        }
        return {
          ...answer.data,
          name: answer.data.target,
        };
      })
    );
  }, cb);
}
export function resolveTxt(
  hostname: string,
  cb: (err: any | null, res?: any) => void
) {
  lookupTxt(hostname, { endpoints: wellknown.endpoints('doh') }).then(
    ({ entries }) => {
      cb(
        null,
        entries.map((entry) => {
          return [entry.data];
        })
      );
    },
    cb
  );
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

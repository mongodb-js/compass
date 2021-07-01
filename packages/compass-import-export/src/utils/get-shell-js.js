import { stringify } from 'mongodb-query-parser';
import toNS from 'mongodb-ns';

export default function(ns, spec) {
  let ret = `db.${toNS(ns).collection}.find(\n`;
  ret += '  ' + stringify(spec.filter ? spec.filter : {}, '');
  if (spec.project) {
    ret += ',\n  ' + stringify(spec.project, '');
  }
  ret += '\n)';
  if (spec.limit) {
    ret += `.limit(${spec.limit})`;
  }
  if (spec.skip) {
    ret += `.skip(${spec.skip})`;
  }
  return ret;
}

import toJavascriptString from 'javascript-stringify';
import toNS from 'mongodb-ns';

export default function(ns, spec) {
  let ret = `db.${toNS(ns).collection}.find(\n`;
  ret += '  ' + toJavascriptString(spec.filter, null, '');
  if (spec.project) {
    ret += ',\n  ' + toJavascriptString(spec.project, null, '');
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

const report = require('../../tmp/depcheck-report.json');

const missing = report.filter((p) => Object.keys(p.depcheck.missing).length)
  .map(p => ({name: p.name, location: p.location, missing: p.depcheck.missing}));


const versions = {
  "brace": "^0.11.1",
  "mongodb-ns": "^2.2.0",
  "debug": "^4.1.0"
}

for (const m of missing) {
  for (const dep of Object.keys(m.missing)) {
    if (!versions[dep]) {
      continue;
    }

    console.log('\n');
    for (const file of m.missing[dep]) {
      console.log(`# ${file}`)
    }



    console.log(
      `json -I -f ${m.location}/package.json -e "this.devDependencies['${dep}']='${versions[dep]}'"`
    )
  }
}

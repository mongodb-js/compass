const fs = require('fs');
const childProcess = require('child_process');
const path = require('path');
const fetch = require('make-fetch-happen');
const { JSDOM } = require('jsdom');

async function main() {
  const { stdout } = childProcess.spawnSync('git', ['ls-files']);

  let links = [];

  const files = stdout
    .toString()
    .split('\n')
    .filter(Boolean)
    .filter((f) => ['.js', '.jsx', '.ts', '.tsx'].includes(path.extname(f)));

  for (const filePath of files) {
    const matches = fs
      .readFileSync(filePath, 'utf-8')
      .match(/https:\/\/docs\.mongodb\.com([^\b\s\n])+/g);
    const urls = (matches || []).map((u) => u.split(/['"`]/)[0]);

    links = [...links, ...urls];
  }

  const uniqueLinks = new Set(links);

  let errors = [];

  for (const link of uniqueLinks) {
    try {
      console.log(link);
      const resp = await fetch(link);

      if (resp.status >= 400) {
        errors.push([link, resp.statusText]);
      }

      const parsedUrl = new URL(link);

      const anchor = (parsedUrl.hash || '').replace(/^#/, '');
      if (anchor) {
        const text = await resp.text();
        const dom = new JSDOM(text);
        const idElem = dom.window.document.getElementById(anchor);
        const aName = dom.window.document.querySelectorAll(
          `a[name="${anchor}"]`
        );

        if (!(idElem || aName[0])) {
          errors.push([link, 'anchor not found']);
        }
      }
    } catch (e) {
      errors.push([link, e.message]);
    }
  }

  if (errors.length) {
    console.log('Found broken links:');
    console.log(JSON.stringify(Object.fromEntries(errors), null, 2));
    process.exit(1);
  }
}

main().catch((e) => {
  console.log(e);
  process.exit(1);
});

/* eslint-disable no-console */
const { request } = require('https');

const exists = (url) => {
  return new Promise((resolve, reject) => {
    try {
      request(url, { method: 'HEAD' }, (res) => {
        if (res.statusCode >= 200 && res.statusCode <= 399) {
          resolve(res.headers.location || url);
        } else {
          const e = new Error(res.statusMessage);
          e.code = res.statusCode;
          reject(e);
        }
      }).end();
    } catch (e) {
      reject(e);
    }
  });
};

(async() => {
  const compassDepsList = await Promise.all(
    require('./compass-deps-list').map(async(pkg) => {
      if (!pkg.repository) {
        try {
          // eslint-disable-next-line no-nested-ternary
          const pkgPath = /^@mongodb-js/.test(pkg.name)
            ? pkg.name.replace('@', '')
            : /^mongodb-/.test(pkg.name)
              ? pkg.name.replace('mongodb-', 'mongodb-js/')
              : `mongodb-js/${pkg.name}`;

          const repo = (await exists(`https://github.com/${pkgPath}`)) + '.git';

          pkg.repository = repo;
        } catch (e) {
          console.error(
            `Failed to resolve package ${pkg.name}: ${e.code} ${e.message}`
          );
        }
      }

      return pkg;
    })
  );

  console.log(compassDepsList);
})();

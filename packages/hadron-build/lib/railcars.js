// 'use strict';
//
// const fs = require('fs');
// const exec = require('child_process').exec;
// const semver = require('semver');
// const cli = require('mongodb-js-cli')('hadron-build:railcars');
//
// const getCurrentVersion = () => {
//   /* eslint no-sync: 0 */
//   return JSON.parse(fs.readFileSync(require.resolve('../package.json'))).version;
// };
//
// const run = (bin, args) => {
//   return new Promise((resolve, reject) => {
//     cli.info(`> ${bin} ${args.join(' ')}`);
//     exec(bin, args, (err, stdout, stderr) => {
//       if (err) {
//         return reject(err);
//       }
//       resolve({
//         stdout: stdout,
//         stderr: stderr
//       });
//     });
//   });
// };
//
// const section = (message) => {
//   return new Promise((resolve) => {
//     cli.info(message);
//     resolve(message);
//   });
// };
//
// const checkCleanWorkingTree = () => {
//   return run('git', ['status', '--porcelain'])
//     .then((res) => {
//       if (res.stdout.trim().length > 0) {
//         throw new Error('Cannot run the railcars with a dirty working tree');
//       }
//     });
// };
//
// const bumpStableVersion = () => {
//   const newVersion = getCurrentVersion().replace(/-beta.*$/, '');
//   return run('npm', ['version', newVersion]);
// };
//
// const bumpBetaVersion = () => {
//   const newVersion = getCurrentVersion().replace(/-dev$/, '-beta0');
//   return run('npm', ['version', newVersion]);
// };
//
// const bumpDevVersion = () => {
//   const newVersion = semver.inc(getCurrentVersion(), 'preminor', 'dev').replace(/\.0$/, '');
//   return run('npm', ['--no-git-tag-version', 'version', newVersion])
//     .then(run('git', ['commit', '-am', newVersion]));
// };
//
// section('Preparing to roll the railcars')
//   .then(checkCleanWorkingTree)
//   .then(run('git', ['checkout', 'master']))
//   .then(run('git', ['pull', '--ff-only', 'origin', 'master']))
//   .then(run('git', ['fetch', 'origin', 'beta:beta', 'stable:stable']))
//   .then(run('git', ['fetch', 'origin', '--tags']))
//
//   .then(section('Checking that merges will be fast-forwards'))
//   // run('git branch --contains beta | grep master'),
//   // run('git branch --contains stable | grep beta'),
//   //
//   // section('Updating stable branch'),
//   // run('git checkout stable'),
//   // run('git merge --ff-only origin/beta'),
//   // bumpStableVersion,
//   //
//   // section('Updating beta branch'),
//   // run('git checkout beta'),
//   // run('git merge --ff-only origin/master'),
//   // run('git merge --strategy ours origin/stable'),
//   // bumpBetaVersion,
//   //
//   // section('Updating master branch'),
//   // run('git checkout master'),
//   // run('git merge --ff-only origin/master'),
//   // run('git merge --strategy ours origin/beta'),
//   // bumpDevVersion,
//   //
//   // section('Pushing changes upstream'),
//   // run('git push origin master:master beta:beta stable:stable'),
//   // run('git push origin --tags')
// .then( () => {
//   /**
//    * TODO (imlucas) Use evergreen api to show status of builds.
//    */
//   cli.ok('now just wait for all CI builds to pass on beta and stable');
// })
// .catch( (err) => cli.abortIfError(err));

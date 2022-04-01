const { runInDir } = require('./run-in-dir');

// Gather all log ids from the Compass source,
async function main() {
  const { stdout } = await runInDir(`git grep --untracked -H mongoLogId`);
  const mapNumberToSource = new Map();

  for (const line of stdout.split('\n').filter(Boolean)) {
    // git grep -H gives us `${filename}:${source}`
    const { filename, source } = line.match(
      /^(?<filename>[^:]+):(?<source>.+)$/
    ).groups;

    if (filename.match(/\.(spec|test)\.(js|jsx|ts|tsx)$/)) continue;
    if (filename.startsWith('configs')) continue;

    if (source.match(/mongoLogId\([^)]*$/)) {
      process.exitCode = 1;
      console.error(`Unmatched mongoLogId() parentheses:`);
      console.error(`${filename}: ${source}`);
    }

    // match all mongoLogId() calls, possibly containing _ as a numeric separator
    const logIdMatches = source.matchAll(/mongoLogId\((?<rawId>[^)]+)\)/g);
    for (const {
      groups: { rawId },
    } of logIdMatches) {
      if (!rawId.match(/^ *[0-9_]+ *$/)) {
        process.exitCode = 1;
        console.error(`Log id ${rawId} does not match the expected format:`);
        console.error(`${filename}: ${source}`);
        continue;
      }

      const id = +rawId.replace(/[ _]/g, '');
      if (id < 1_001_000_000 || id >= 1_002_000_000) {
        process.exitCode = 1;
        console.error(`Log id ${id} is out of the Compass log id range:`);
        console.error(`${filename}: ${source}`);
      }

      // If duplicating a log id is actually intentional, '!dupedLogId'
      // can be used in a comment to suppress the error that this
      // script would usually generate.
      if (source.includes('!dupedLogId')) {
        if (mapNumberToSource.has(id)) {
          continue;
        }
        process.exitCode = 1;
        console.error(`Log id ${id} should have been duplicated but is not:`);
        console.error(`${filename}: ${source}`);
      } else if (mapNumberToSource.has(id)) {
        const existing = mapNumberToSource.get(id);
        process.exitCode = 1;
        console.error(`Log id ${id} has been duplicated:`);
        console.error(`${filename}: ${source}`);
        console.error(`${existing.filename}: ${existing.source}`);
      } else {
        mapNumberToSource.set(id, { filename, source });
      }
    }
  }

  {
    const nextId = Math.max(...mapNumberToSource.keys()) + 1;
    // Get the pretty version with numeric separators by matching
    // any digit that is followed by a number of digits that is a
    // multiple of 3 and adding a _ behind it.
    const pretty = String(nextId).replace(/(.)(?=(.{3})+$)/g, '$1_');
    console.log(`Next available log id: ${pretty} (${nextId})`);
  }
}

process.on('unhandledRejection', (err) => {
  console.error();
  console.error(err.stack || err.message || err);
  process.exitCode = 1;
});

main();

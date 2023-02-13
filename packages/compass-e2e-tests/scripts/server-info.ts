import { MongoClient } from 'mongodb';

export async function getServerVersion(connectionString: string) {
  const client = await MongoClient.connect(connectionString);
  try {
    const buildInfo = await client.db('admin').command({ buildInfo: 1 });
    return {
      version: buildInfo.version,
      enterprise: buildInfo.modules?.includes('enterprise') || false,
    };
  } finally {
    await client.close();
  }
}

void (async () => {
  try {
    const index = process.argv.indexOf('--connectionString') ?? -1;
    const connectionString =
      index === -1 ? 'mongodb://localhost:27091' : process.argv[index + 1];
    console.log(JSON.stringify(await getServerVersion(connectionString)));
  } catch (err) {
    const { name, message } = err as Error;
    console.error(`${name}: ${message}`);
    process.exitCode = 1;
  }
})();

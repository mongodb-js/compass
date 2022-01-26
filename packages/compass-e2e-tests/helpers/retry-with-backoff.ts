import delay from './delay';

export default async function retryWithBackoff(
  fn = async () => {
    return Promise.resolve();
  },
  retries = 3,
  backoffStep = 200
): Promise<any> {
  let err;
  let attempt = 0;
  while (attempt < retries) {
    try {
      return await fn();
    } catch (e) {
      err = e;
      attempt++;
      if (attempt < retries) {
        console.warn(err);
        await delay(backoffStep * attempt);
      }
    }
  }
  throw err;
}

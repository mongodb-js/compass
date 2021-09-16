const { delay } = require('./delay');

async function retryWithBackoff(
  fn = async () => {},
  retries = 3,
  backoffStep = 200
) {
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
        delay(backoffStep * attempt);
      }
    }
  }
  throw err;
}

module.exports = { retryWithBackoff };

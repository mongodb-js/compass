function delay(ms = 1000) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

module.exports = { delay };

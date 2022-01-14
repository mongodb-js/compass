const Selectors = require('../selectors');

const MINUTE = 60_000;

module.exports = function (app) {
  return async function waitForConnectionScreen() {
    const { client } = app;
    const connectScreenElement = await client.$(Selectors.ConnectSection);
    await connectScreenElement.isDisplayed()
    // await client.waitUntil(
    //   async () => {
    //     const connectScreenElement = await client.$(Selectors.ConnectSection);
    //     return await connectScreenElement.isDisplayed();
    //   },
    //   {
    //     timeout: MINUTE,
    //     timeoutMsg: 'Expected connection screen to be visible',
    //     interval: 50,
    //   }
    // );
  };
};

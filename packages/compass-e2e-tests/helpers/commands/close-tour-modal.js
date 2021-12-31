const Selectors = require('../selectors');

module.exports = function (app, page, commands) {
  return async function () {
    if (!(await commands.existsEventually(Selectors.FeatureTourModal))) {
      console.log('feature tour modal never became visible');
      return;
    }

    const featureTourModalElement = await page.locator(
      Selectors.FeatureTourModal
    );

    await featureTourModalElement.waitFor();
    await page.click(Selectors.CloseFeatureTourModal);
    await featureTourModalElement.waitFor({
      state: 'hidden',
    });
  };
};

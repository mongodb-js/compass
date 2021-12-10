const Selectors = require('../selectors');

module.exports = function (app, page, commands) {
  return async function setValidation(value) {
    await commands.setAceValue(Selectors.ValidationEditor, value);

    // it should eventually detect that the text changed
    const validationActionMessage = page.locator(
      Selectors.ValidationActionMessage
    );
    await validationActionMessage.waitFor();

    await page.click(Selectors.UpdateValidationButton);

    // both buttons should become hidden if it succeeds
    await validationActionMessage.waitFor({
      // since this is a db query the default timeout might not be long enough
      timeout: 30_000,
      state: 'hidden',
    });

    await page.waitForSelector(Selectors.UpdateValidationButton, {
        state: 'hidden'
    });
  };
};

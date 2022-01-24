const Selectors = require('../selectors');

module.exports = function (compass) {
  return async function setValidation(value) {
    const { browser } = compass;

    await browser.setAceValue(Selectors.ValidationEditor, value);

    // it should eventually detect that the text changed
    const validationActionMessageElement = await browser.$(
      Selectors.ValidationActionMessage
    );
    await validationActionMessageElement.waitForDisplayed();

    await browser.clickVisible(Selectors.UpdateValidationButton);

    // both buttons should become hidden if it succeeds
    await validationActionMessageElement.waitForDisplayed({
      // since this is a db query the default timeout might not be long enough
      timeout: 30_000,
      reverse: true,
    });

    const updateValidationButtonElement = await browser.$(
      Selectors.UpdateValidationButton
    );
    await updateValidationButtonElement.waitForDisplayed({
      reverse: true,
    });
  };
};

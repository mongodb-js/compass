const Selectors = require('../selectors');

module.exports = function (app) {
  return async function setValidation(value) {
    const { client } = app;

    await client.setAceValue(Selectors.ValidationEditor, value);

    // it should eventually detect that the text changed
    const validationActionMessageElement = await client.$(
      Selectors.ValidationActionMessage
    );
    await validationActionMessageElement.waitForDisplayed();

    await client.clickVisible(Selectors.UpdateValidationButton);

    // both buttons should become hidden if it succeeds
    await validationActionMessageElement.waitForDisplayed({
      reverse: true,
    });

    const updateValidationButtonElement = await client.$(
      Selectors.UpdateValidationButton
    );
    await updateValidationButtonElement.waitForDisplayed({
      reverse: true,
    });
  };
};

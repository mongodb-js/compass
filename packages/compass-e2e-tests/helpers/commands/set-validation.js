const Selectors = require('../selectors');

module.exports = function (app) {
  return async function setValidation(value) {
    const { client } = app;

    await client.setAceValue(Selectors.ValidationEditor, value);

    // it should eventually detect that the text changed
    await client.waitForVisible(Selectors.ValidationActionMessage);

    await client.clickVisible(Selectors.UpdateValidationButton);

    // both buttons should become hidden if it succeeds
    await client.waitForVisible(
      Selectors.ValidationActionMessage,
      undefined,
      true
    );
    await client.waitForVisible(
      Selectors.UpdateValidationButton,
      undefined,
      true
    );
  };
};

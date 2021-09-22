const Selectors = require('../selectors');

module.exports = function (app) {
  return async function setValidation(value) {
    const { client } = app;

    await client.setAceValue(Selectors.ValidationEditor, value);

    // it should eventually detect that the text changed
    await client.waitForVisible(Selectors.ValidationActionMessage);
    //expect(await client.getText(Selectors.ValidationActionMessage)).to.equal('Validation modified');

    await client.clickVisible(Selectors.UpdateValidationButton);

    // both buttons should become hidden if it succeeds
    await client.waitForVisible(Selectors.ValidationActionMessage, 1000, true);
    await client.waitForVisible(Selectors.UpdateValidationButton, 1000, true);
  };
};

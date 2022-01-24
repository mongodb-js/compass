module.exports = function (compass) {
  return async function setOrClearValue(selector, value) {
    const { browser } = compass;

    // element.setValue() doesn't reliably work with ''.
    const element = await browser.$(selector);
    await element.setValue(value);

    if (value === '') {
      // element.clearValue() doesn't work reliably either.
      await element.clearValue();

      // TODO: what happens is that the field gets cleared, but the moment it
      // blurs it gets reset to whatever it was before. I can't recreate it
      // outside of e2e tests.
    }
  };
};

const META = process.platform === 'darwin' ? 'Meta' : 'Control';

module.exports = function (compass) {
  return async function setOrClearValue(selector, value) {
    const { browser } = compass;

    // element.setValue() doesn't reliably work with ''.
    const element = await browser.$(selector);
    await element.setValue(value);

    if (value === '') {
      // element.clearValue() doesn't work reliably either.
      await element.clearValue();

      await browser.waitUntil(async () => {
        await browser.clickVisible(selector);
        // Cmd-A doesn't always work in this context which means this might only
        // remove the last character. So I'm giving up and just backspacing in a
        // loop. The waitUntil also acts as an assertion to make sure it
        // eventually did what we wanted.
        await browser.keys([META, 'a']);
        await browser.keys([META]); // meta a second time to release it
        await browser.keys(['Backspace']);

        const newValue = await element.getValue(selector);
        return newValue === value;
      });
    }
  };
};

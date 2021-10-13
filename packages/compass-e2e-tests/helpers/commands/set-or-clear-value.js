const META = process.platform === 'darwin' ? 'Meta' : 'Control';

module.exports = function (app) {
  return async function setOrClearValue(selector, value) {
    const { client } = app;

    // client.setValue() doesn't reliably work with ''.
    await client.setValue(selector, value);

    if (value === '') {
      // client.elementIdClear() doesn't work reliably either.
      const elem = await client.$(selector);
      await client.elementIdClear(elem.value.ELEMENT);

      await client.waitUntil(async () => {
        await client.clickVisible(selector);
        // Cmd-A doesn't always work in this context which means this might only
        // remove the last character. So I'm giving up and just backspacing in a
        // loop. The waitUntil also acts as an assertion to make sure it
        // eventually did what we wanted.
        await client.keys([META, 'a']);
        await client.keys([META]); // meta a second time to release it
        await client.keys(['Backspace']);

        const newValue = await client.getValue(selector);
        return newValue === value;
      });
    }
  };
};

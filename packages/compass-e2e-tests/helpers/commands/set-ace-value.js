const META = process.platform === 'darwin' ? 'Meta' : 'Control';

module.exports = function (app) {
  return async function setAceValue(selector, value) {
    const { client } = app;
    await client.clickVisible(`${selector} .ace_scroller`);
    await client.keys([META, 'a']);
    await client.keys([META]); // meta a second time to release it
    await client.keys(['Backspace']);
    await client.keys(value);
  };
};

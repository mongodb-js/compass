module.exports = function (app) {
  return async function setAceValue(selector, value) {
    const { client } = app;
    await client.clickVisible(`${selector} .ace_scroller`);
    await client.keys(['Meta', 'a']);
    await client.keys(['Meta']); // meta a second time to release it
    await client.keys(['Backspace']);
    await client.keys(value);
  };
};

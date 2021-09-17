module.exports = function (app) {
  return async function focusStageOperator(index) {
    const { client } = app;

    const stageSelector = `[data-stage-index="${index}"]`;

    await client.clickVisible(`${stageSelector} button[title="Collapse"]`);
    await client.clickVisible(`${stageSelector} button[title="Expand"]`);
    await client.keys(['Tab']);
    await client.waitForVisible(`${stageSelector} .Select-control input[aria-expanded="true"]`)
  };
};

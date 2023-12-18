import { Selectors } from '../compass';
import type { CompassBrowser } from '../compass-browser';

/**
 * Saves an aggregation pipeline.
 *
 * This helper expects that the browser is already on the aggregations tab for the target collection.
 */
export async function saveAggregationPipeline(
  browser: CompassBrowser,
  aggregationName: string,
  pipeline: Record<string, any>[]
) {
  for (let index = 0; index < pipeline.length; index++) {
    const stage = pipeline[index];
    const stageOperator = Object.keys(stage)[0];
    const stageValue = stage[stageOperator];

    // add stage
    await browser.clickVisible(Selectors.AddStageButton);
    await browser.$(Selectors.stageEditor(index)).waitForDisplayed();

    await browser.focusStageOperator(index);
    await browser.selectStageOperator(index, stageOperator);
    await browser.setCodemirrorEditorValue(
      Selectors.stageEditor(index),
      stageValue
    );
  }

  await browser.clickVisible(Selectors.SavePipelineMenuButton);
  const menuElement = await browser.$(Selectors.SavePipelineMenuContent);
  await menuElement.waitForDisplayed();
  await browser.clickVisible(Selectors.SavePipelineSaveAsAction);

  // wait for the modal to appear
  const savePipelineModal = await browser.$(Selectors.SavePipelineModal);
  await savePipelineModal.waitForDisplayed();

  // set aggregation name
  await browser.waitForAnimations(Selectors.SavePipelineNameInput);
  const pipelineNameInput = await browser.$(Selectors.SavePipelineNameInput);
  await pipelineNameInput.setValue(aggregationName);

  const createButton = await browser
    .$(Selectors.SavePipelineModal)
    .$('button=Save');

  await createButton.click();
}

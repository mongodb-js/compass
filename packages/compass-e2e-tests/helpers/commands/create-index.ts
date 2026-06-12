import type { CompassBrowser } from '../compass-browser.ts';
import * as Selectors from '../selectors.ts';

type CreateIndexOptions = {
  uniqueIndex?: boolean;
  indexName?: string;
  ttl?: number;
  partialFilterExpression?: string;
  wildcardProjection?: string;
  customCollation?: string;
  sparseIndex?: boolean;
} & (
  | {
      rollingIndex?: true;
      rollingIndexTimeout: number;
    }
  | {
      rollingIndex?: false;
    }
);

type IndexType = '1' | '-1' | '2dsphere' | 'text';

const indexTypeToIndexSelectOption: Record<IndexType, string> = {
  '1': '1 (asc)',
  '-1': '-1 (desc)',
  '2dsphere': '2dsphere',
  text: 'text (full text search)',
} as const;

export async function createIndex(
  browser: CompassBrowser,
  indexDefinition: {
    fieldName: string;
    indexType: IndexType;
  },
  extraOptions?: CreateIndexOptions,
  screenshotName?: string
): Promise<string> {
  const createRowIndex = 0;
  const { fieldName, indexType } = indexDefinition;
  const indexName = extraOptions?.indexName ?? `${fieldName}_${indexType}`;

  // Open the modal
  const isWithCreateDropdown = await browser
    .$(Selectors.CreateIndexDropdownButton)
    .isExisting();
  if (isWithCreateDropdown) {
    await browser.waitUntil(async () => {
      await browser.clickVisible(Selectors.CreateIndexDropdownButton);
      return await browser
        .$(Selectors.createIndexDropdownAction('regular-indexes'))
        .isExisting();
    });
    await browser.clickVisible(
      Selectors.createIndexDropdownAction('regular-indexes')
    );
  } else {
    await browser.clickVisible(Selectors.CreateIndexButton);
  }

  await browser.waitForOpenModal(Selectors.CreateIndexModal);

  // Select / type field name
  await browser.setComboBoxValue(
    Selectors.createIndexModalFieldNameSelectInput(createRowIndex),
    fieldName
  );

  // Select field type
  const fieldTypeSelect = browser.$(
    Selectors.createIndexModalFieldTypeSelectButton(createRowIndex)
  );
  await fieldTypeSelect.waitForDisplayed();
  await fieldTypeSelect.click();
  const fieldTypeSelectMenu = browser.$(
    Selectors.createIndexModalFieldTypeSelectMenu(createRowIndex)
  );
  await fieldTypeSelectMenu.waitForDisplayed();
  await browser.clickVisible(
    `li[value="${indexTypeToIndexSelectOption[indexType]}"]`
  );
  await fieldTypeSelectMenu.waitForDisplayed({ reverse: true });

  // Select extra options
  if (extraOptions) {
    await browser.clickVisible(Selectors.IndexToggleOptions);
    const { wildcardProjection, rollingIndex, indexName } = extraOptions;

    if (indexName) {
      await browser.clickVisible(Selectors.indexToggleOption('name'));
      await browser
        .$(Selectors.indexOptionInput('name', 'text'))
        .setValue(indexName);
    }

    if (wildcardProjection) {
      await browser.clickVisible(
        Selectors.indexToggleOption('wildcardProjection')
      );

      // set the text in the editor
      await browser.setCodemirrorEditorValue(
        Selectors.indexOptionInput('wildcardProjection', 'code'),
        wildcardProjection
      );
    }

    if (rollingIndex) {
      await browser.clickVisible(
        Selectors.indexToggleOption('buildInRollingProcess')
      );
    }
  }

  if (screenshotName) {
    await browser.screenshot(screenshotName);
  }

  // Create the index
  await browser.clickVisible(Selectors.CreateIndexConfirmButton);

  // Assert that modal goes away
  await browser.waitForOpenModal(Selectors.CreateIndexModal, { reverse: true });

  // Assert that index does come in table
  const indexComponentSelector = Selectors.indexComponent(indexName);
  const indexComponent = browser.$(indexComponentSelector);
  await indexComponent.waitForDisplayed();

  const readySelector = Selectors.indexWithStatus(indexName, 'ready');
  const buildingSelector = Selectors.indexWithStatus(indexName, 'building');

  // Regular index should become ready relatively quicker than rolling indexes.
  if (!extraOptions?.rollingIndex) {
    await browser
      // We do not wait for the index to be in-progress state, because sometimes it really quick
      // and it does not show in the status, leading to flaky tests.
      .$(readySelector)
      .waitForDisplayed();
  } else {
    // The rolling index build may complete before the poll has it
    // in a building state.
    await browser.waitUntil(
      async () => {
        return (
          (await browser.$(buildingSelector).isExisting()) ||
          (await browser.$(readySelector).isExisting())
        );
      },
      {
        timeout: extraOptions.rollingIndexTimeout,
        interval: 2_000,
      }
    );

    // Now wait for index to finish building
    await browser.waitUntil(async () => browser.$(readySelector).isExisting(), {
      timeout: extraOptions.rollingIndexTimeout,
      // Building a rolling index is a slow process, no need to check too
      // often
      interval: 2_000,
    });
  }

  return indexName;
}

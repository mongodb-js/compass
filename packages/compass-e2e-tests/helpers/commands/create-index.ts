import type { CompassBrowser } from '../compass-browser';
import * as Selectors from '../selectors';

type CreateIndexOptions = {
  uniqueIndex?: boolean;
  indexName?: string;
  ttl?: number;
  partialFilterExpression?: string;
  wildcardProjection?: string;
  customCollation?: string;
  sparseIndex?: boolean;
};

type IndexType = '1' | '-1' | '2dsphere' | 'text';

const indexTypeToIndexSelectOption: Record<IndexType, string> = {
  '1': '1 (asc)',
  '-1': '-1 (desc)',
  '2dsphere': '2dsphere',
  text: 'text',
};

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
  const createModal = await browser.$(Selectors.CreateIndexModal);
  await createModal.waitForDisplayed();

  // Select / type field name
  await browser.setValueVisible(
    Selectors.createIndexModalFieldNameSelectInput(createRowIndex),
    fieldName
  );
  await browser.keys(['Enter']);

  // Select field type
  const fieldTypeSelect = await browser.$(
    Selectors.createIndexModalFieldTypeSelectButton(createRowIndex)
  );
  await fieldTypeSelect.waitForDisplayed();
  await fieldTypeSelect.click();
  const fieldTypeSelectMenu = await browser.$(
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
    const { wildcardProjection } = extraOptions;

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
  }

  if (screenshotName) {
    await browser.screenshot(screenshotName);
  }

  // Create the index
  await browser.clickVisible(Selectors.CreateIndexConfirmButton);

  // Assert that modal goes away
  await createModal.waitForDisplayed({ reverse: true });

  // Assert that index does come in table
  const indexComponentSelector = Selectors.indexComponent(indexName);
  const indexComponent = await browser.$(indexComponentSelector);
  await indexComponent.waitForDisplayed();

  return indexName;
}

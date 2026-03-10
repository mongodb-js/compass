import type { SearchTemplate } from '@mongodb-js/mongodb-constants';
import { ATLAS_VECTOR_SEARCH_TEMPLATE } from '@mongodb-js/mongodb-constants';
import React, { useCallback } from 'react';
import {
  Select,
  Option,
  css,
  spacing,
  InfoSprinkle,
  Label,
  useId,
} from '@mongodb-js/compass-components';

/**
 * Atlas Vector Search index definition template for automated embedding
 * (public preview). Stored locally rather than in @mongodb-js/mongodb-constants.
 */
export const ATLAS_VECTOR_AUTO_EMBED_TEMPLATE: SearchTemplate = {
  name: 'Automated embedding',
  snippet: `{
  "fields": [
    {
      "type": "autoEmbed",
      "modality": "text",
      "path": "\${1:<field-name>}",
      "model": "\${2:voyage-4}"
    }
  ]
}`,
  version: '4.4.0',
};

export type VectorIndexTemplateChoice = 'autoEmbed' | 'bringYourOwn';

const containerStyles = css({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[100],
});

const dropdownLabelStyles = css({
  display: 'flex',
  gap: spacing[100],
  alignItems: 'center',
});

const VECTOR_TEMPLATE_BY_CHOICE: Record<
  VectorIndexTemplateChoice,
  SearchTemplate
> = {
  autoEmbed: ATLAS_VECTOR_AUTO_EMBED_TEMPLATE,
  bringYourOwn: ATLAS_VECTOR_SEARCH_TEMPLATE,
};

type VectorSearchIndexTemplateDropdownProps = {
  tooltip: string;
  value: VectorIndexTemplateChoice;
  onTemplateChoice: (
    choice: VectorIndexTemplateChoice,
    template: SearchTemplate
  ) => void;
};

export const VectorSearchIndexTemplateDropdown: React.FunctionComponent<
  VectorSearchIndexTemplateDropdownProps
> = ({ tooltip, value, onTemplateChoice }) => {
  const labelId = useId();

  const onChoose = useCallback(
    (choice: string) => {
      const typed = choice as VectorIndexTemplateChoice;
      onTemplateChoice(typed, VECTOR_TEMPLATE_BY_CHOICE[typed]);
    },
    [onTemplateChoice]
  );

  return (
    <div className={containerStyles} data-testid="vector-search-index-template">
      <div className={dropdownLabelStyles}>
        <Label id={labelId} htmlFor="vector-template-dropdown">
          Template
        </Label>
        <InfoSprinkle align="right">{tooltip}</InfoSprinkle>
      </div>
      <Select
        id="vector-template-dropdown"
        aria-labelledby={labelId}
        value={value}
        allowDeselect={false}
        onChange={onChoose}
      >
        <Option value="autoEmbed">Automated embedding</Option>
        <Option value="bringYourOwn">Bring your own embeddings</Option>
      </Select>
    </div>
  );
};

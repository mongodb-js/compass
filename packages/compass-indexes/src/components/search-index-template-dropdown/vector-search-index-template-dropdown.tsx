import type { SearchTemplate } from '@mongodb-js/mongodb-constants';
import {
  ATLAS_VECTOR_SEARCH_AUTO_EMBED_TEMPLATE,
  ATLAS_VECTOR_SEARCH_TEMPLATE,
} from '@mongodb-js/mongodb-constants';
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
> = Object.create({
  autoEmbed: ATLAS_VECTOR_SEARCH_AUTO_EMBED_TEMPLATE,
  bringYourOwn: ATLAS_VECTOR_SEARCH_TEMPLATE,
});

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

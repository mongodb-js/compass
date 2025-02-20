import { ATLAS_SEARCH_TEMPLATES } from '@mongodb-js/mongodb-constants';
import type { SearchTemplate } from '@mongodb-js/mongodb-constants';
import React, { useState, useCallback, useMemo } from 'react';
import {
  Select,
  Option,
  css,
  spacing,
  InfoSprinkle,
  Label,
  useId,
} from '@mongodb-js/compass-components';

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

type SearchIndexTemplateDropdownProps = {
  tooltip: string;
  isVectorSearchSupported: boolean;
  onTemplate: (template: SearchTemplate) => void;
};

export const SearchIndexTemplateDropdown: React.FunctionComponent<
  SearchIndexTemplateDropdownProps
> = ({ isVectorSearchSupported, tooltip, onTemplate }) => {
  const [templateValue, setTemplateValue] = useState('0');
  const labelId = useId();

  const onChooseTemplate = useCallback(
    (value: string) => {
      setTemplateValue(value);
      onTemplate(ATLAS_SEARCH_TEMPLATES[+value]);
    },
    [onTemplate]
  );

  const templates = useMemo(() => {
    // When vector search is supported we don't show the
    // KNN Vector field mapping option.
    if (isVectorSearchSupported) {
      return ATLAS_SEARCH_TEMPLATES.filter(
        (template) => template.name !== 'KNN Vector field mapping'
      );
    }
    return ATLAS_SEARCH_TEMPLATES;
  }, [isVectorSearchSupported]);

  return (
    <div className={containerStyles}>
      <div className={dropdownLabelStyles}>
        <Label id={labelId} htmlFor="template-dropdown">
          Template
        </Label>
        <InfoSprinkle align="right">{tooltip}</InfoSprinkle>
      </div>
      <Select
        id="template-dropdown"
        aria-labelledby={labelId}
        value={templateValue}
        allowDeselect={false}
        onChange={onChooseTemplate}
      >
        {templates.map((template, idx) => (
          <Option key={idx} value={`${idx}`}>
            {template.name}
          </Option>
        ))}
      </Select>
    </div>
  );
};

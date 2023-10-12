import { ATLAS_SEARCH_TEMPLATES } from '@mongodb-js/mongodb-constants';
import type { SearchTemplate } from '@mongodb-js/mongodb-constants';
import React, { useState, useCallback } from 'react';
import {
  Select,
  Option,
  css,
  spacing,
  InfoSprinkle,
  Label,
} from '@mongodb-js/compass-components';

const containerStyles = css({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[1],
});

const dropdownLabelStyles = css({
  display: 'flex',
  gap: spacing[1],
  alignItems: 'center',
});

type SearchIndexTemplateDropdownProps = {
  tooltip: string;
  onTemplate: (template: SearchTemplate) => void;
};

export const SearchIndexTemplateDropdown: React.FunctionComponent<
  SearchIndexTemplateDropdownProps
> = ({ tooltip, onTemplate }) => {
  const [templateValue, setTemplateValue] = useState('0');

  const onChooseTemplate = useCallback(
    (value: string) => {
      setTemplateValue(value);
      onTemplate(ATLAS_SEARCH_TEMPLATES[+value]);
    },
    [onTemplate]
  );

  return (
    <div className={containerStyles}>
      <div className={dropdownLabelStyles}>
        <Label htmlFor="template-dropdown">Template</Label>
        <InfoSprinkle align="right">{tooltip}</InfoSprinkle>
      </div>
      <Select
        id="template-dropdown"
        aria-labelledby="Template"
        value={templateValue}
        allowDeselect={false}
        onChange={onChooseTemplate}
      >
        {ATLAS_SEARCH_TEMPLATES.map((template, idx) => (
          <Option key={idx} value={`${idx}`}>
            {template.name}
          </Option>
        ))}
      </Select>
    </div>
  );
};

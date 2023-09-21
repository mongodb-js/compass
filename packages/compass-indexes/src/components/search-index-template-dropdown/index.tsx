import { ATLAS_SEARCH_TEMPLATES } from '@mongodb-js/mongodb-constants';
import type { SearchTemplate } from '@mongodb-js/mongodb-constants';
import React, { useState, useCallback } from 'react';
import {
  Select,
  Option,
  Icon,
  css,
  spacing,
  Tooltip,
} from '@mongodb-js/compass-components';

const dropdownStyles = css({
  display: 'flex',
  overflow: 'hidden',
  gap: 0,
});

const overlapDropdownLabelStyles = css({
  marginLeft: -spacing[3],
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
    <section className={dropdownStyles}>
      <Select
        value={templateValue}
        allowDeselect={false}
        onChange={onChooseTemplate}
        label={'Template'}
      >
        {ATLAS_SEARCH_TEMPLATES.map((template, idx) => (
          <Option key={idx} value={`${idx}`}>
            {template.name}
          </Option>
        ))}
      </Select>
      <Tooltip
        align="right"
        triggerEvent="hover"
        trigger={({ children, ...props }) => (
          <>
            {children}
            <Icon
              {...props}
              data-testid="search-template-info-icon"
              className={overlapDropdownLabelStyles}
              glyph="InfoWithCircle"
            />
          </>
        )}
      >
        {tooltip}
      </Tooltip>
    </section>
  );
};

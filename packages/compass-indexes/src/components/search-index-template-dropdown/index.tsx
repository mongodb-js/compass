import { ATLAS_SEARCH_TEMPLATES } from '@mongodb-js/mongodb-constants';
import type { SearchTemplate } from '@mongodb-js/mongodb-constants';
import React, { useState, useCallback } from 'react';
import {
  Select,
  Option,
  Icon,
  css,
  Tooltip,
} from '@mongodb-js/compass-components';

const dropdownLabelStyles = css({
  display: 'flex',
  pointerEvents: 'auto', // leafy green specifies none in the label, which is wrong
});

const fillParentStyles = css({
  flexGrow: 1,
});

type SearchIndexTemplateDropdownLabelProps = {
  label: string;
  tooltip: string;
};

const SearchIndexTemplateDropdownLabel: React.FunctionComponent<
  SearchIndexTemplateDropdownLabelProps
> = ({ label, tooltip }) => (
  <div className={dropdownLabelStyles}>
    <span className={fillParentStyles}>{label}</span>
    <Tooltip
      align="right"
      triggerEvent="hover"
      trigger={({ children, ...props }) => (
        <div {...props}>
          <Icon
            data-testid="search-template-info-icon"
            glyph="InfoWithCircle"
          />
          {children}
        </div>
      )}
    >
      {tooltip}
    </Tooltip>
  </div>
);

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
    <Select
      value={templateValue}
      allowDeselect={false}
      onChange={onChooseTemplate}
      /* @ts-expect-error The label can be any React component, however, the type definition forces a string. */
      label={
        <SearchIndexTemplateDropdownLabel label="Template" tooltip={tooltip} />
      }
    >
      {ATLAS_SEARCH_TEMPLATES.map((template, idx) => (
        <Option key={idx} value={`${idx}`}>
          {template.name}
        </Option>
      ))}
    </Select>
  );
};

import { ATLAS_SEARCH_TEMPLATES } from '@mongodb-js/mongodb-constants';
import type { SearchTemplate } from '@mongodb-js/mongodb-constants';
import React, { useState, useCallback } from 'react';
import { Select, Option } from '@mongodb-js/compass-components';

type SearchIndexTemplateDropdownProps = {
  onTemplate: (template: SearchTemplate) => void;
};

export const SearchIndexTemplateDropdown: React.FunctionComponent<
  SearchIndexTemplateDropdownProps
> = ({ onTemplate }) => {
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
      label={'Template'}
    >
      {ATLAS_SEARCH_TEMPLATES.map((template, idx) => (
        <Option key={idx} value={`${idx}`}>
          {template.name}
        </Option>
      ))}
    </Select>
  );
};

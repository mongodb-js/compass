import React, { useCallback } from 'react';
import { TextInput } from '@mongodb-js/compass-components';

export default function NavigationItemsFilter({
  placeholder = 'Search',
  ariaLabel = 'Search',
  title = 'Search',
  onFilterChange,
  searchInputClassName,
}: {
  placeholder?: string;
  ariaLabel?: string;
  title?: string;
  searchInputClassName?: string;
  onFilterChange(regex: RegExp | null): void;
}): React.ReactElement {
  const onChange = useCallback(
    (event) => {
      const searchString: string = event.target.value;

      let re;

      try {
        re = searchString ? new RegExp(searchString, 'i') : null;
      } catch (e) {
        re = null;
      }

      onFilterChange(re);
    },
    [onFilterChange]
  );

  const onSubmit = useCallback((evt) => {
    evt.preventDefault();
    evt.stopPropagation();
  }, []);

  return (
    <form noValidate onSubmit={onSubmit}>
      <TextInput
        data-testid="sidebar-filter-input"
        placeholder={placeholder}
        type="search"
        aria-label={ariaLabel}
        title={title}
        onChange={onChange}
        className={searchInputClassName}
      />
    </form>
  );
}

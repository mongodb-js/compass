import React, { useCallback } from 'react';
import { TextInput } from '@mongodb-js/compass-components';

export default function NavigationItemsFilter({
  placeholder = 'Search',
  ariaLabel = 'Search',
  title = 'Search',
  onFilterChange,
  className,
}: {
  placeholder?: string;
  ariaLabel?: string;
  title?: string;
  onFilterChange(regex: RegExp | null): void;
  className?: string;
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
    <form noValidate className={className} onSubmit={onSubmit}>
      <TextInput
        data-testid="sidebar-filter-input"
        placeholder={placeholder}
        type="search"
        aria-label={ariaLabel}
        title={title}
        onChange={onChange}
      />
    </form>
  );
}

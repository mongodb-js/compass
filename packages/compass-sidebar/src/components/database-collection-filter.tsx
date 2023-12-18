import React, { useCallback } from 'react';
import { spacing, css, TextInput } from '@mongodb-js/compass-components';

const databaseCollectionsFilter = css({
  margin: `${spacing[1]}px ${spacing[3]}px`,
});

export default function DatabaseCollectionFilter({
  onFilterChange,
}: {
  onFilterChange(regex: RegExp | null): void;
}) {
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
        placeholder="Search"
        type="search"
        aria-label="Databases and collections filter"
        title="Databases and collections filter"
        onChange={onChange}
        className={databaseCollectionsFilter}
      />
    </form>
  );
}

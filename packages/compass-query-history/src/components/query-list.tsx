import React from 'react';

import { spacing, css } from '@mongodb-js/compass-components';

import { ZeroGraphic } from './zero-graphic';

const componentStyles = css({
  overflowY: 'auto',
  padding: spacing[3],
  paddingTop: 0,
});

type QueryListProps = {
  items: any[]; // TODO: ampersand collection types
  actions: any; // TODO: Action types? or none. do none
  current: null | any; // TODO: null or query? do we need this??
  ns: string;
};

const queryListFactory = (
  ListItem: React.FunctionComponent<{
    model: any; // TODO: ampersand model types.
    actions: any; // TODO: Action types? or none. do none
  }>
) => {
  function QueryList({
    items = [], // TODO: Can we remove defaults?
    current = null,
    ns = '',
    actions,
  }: QueryListProps) {
    const renderItems = items
      .filter((item) => item._ns === ns)
      .map((item, index) => (
        <ListItem key={index + 1} model={item} actions={actions} />
      ));

    const renderZeroState = renderItems.length === 0 && current === null;

    return (
      <div className={componentStyles}>
        {renderZeroState ? <ZeroGraphic /> : <div>{renderItems}</div>}
      </div>
    );
  }

  return QueryList;
};

export { queryListFactory };

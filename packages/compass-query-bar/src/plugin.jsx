import React, { useCallback } from 'react';
import PropTypes from 'prop-types';
import { StoreConnector } from 'hadron-react-components';
import { isFunction } from 'lodash';

import LegacyQueryBar from './components/legacy-query-bar';
import { QueryBar } from './components/query-bar';

function Plugin({
  actions,
  onApply: _onApply,
  onReset: _onReset,
  store,
  ...props
}) {
  const useNewQueryBar = process?.env?.COMPASS_SHOW_NEW_TOOLBARS === 'true';

  const onApply = useCallback(() => {
    actions.apply();

    if (isFunction(_onApply)) {
      _onApply();
    }
  }, [_onApply, actions]);

  const onReset = useCallback(() => {
    actions.reset();

    if (isFunction(_onReset)) {
      _onReset();
    }
  }, [_onReset, actions]);

  return (
    <StoreConnector store={store}>
      {useNewQueryBar ? (
        <QueryBar
          onApply={onApply}
          onReset={onReset}
          onChangeQueryOption={actions.typeQueryString}
          refreshEditorAction={actions.refreshEditor}
          toggleExpandQueryOptions={actions.toggleQueryOptions}
          toggleQueryHistory={actions.toggleQueryHistory}
        />
      ) : (
        <LegacyQueryBar
          actions={actions}
          onApply={onApply}
          onReset={onReset}
          {...props}
        />
      )}
    </StoreConnector>
  );
}

Plugin.displayName = 'QueryBarPlugin';
Plugin.propTypes = {
  actions: PropTypes.object.isRequired,
  onApply: PropTypes.func,
  onReset: PropTypes.func,
  store: PropTypes.object.isRequired,
};

export default Plugin;
export { Plugin };

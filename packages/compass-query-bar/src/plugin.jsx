import React, { useCallback } from 'react';
import PropTypes from 'prop-types';
import { StoreConnector } from 'hadron-react-components';
import { isFunction } from 'lodash';

import { QueryBar } from './components/query-bar';

function Plugin({
  actions,
  onApply: _onApply,
  onReset: _onReset,
  resultId,
  store,
  queryOptions,
  ...props
}) {
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
      <QueryBar
        onApply={onApply}
        onReset={onReset}
        onChangeQueryOption={actions.typeQueryString}
        onOpenExportToLanguage={actions.exportToLanguage}
        refreshEditorAction={actions.refreshEditor}
        toggleExpandQueryOptions={actions.toggleQueryOptions}
        globalAppRegistry={store.globalAppRegistry}
        localAppRegistry={store.localAppRegistry}
        queryOptions={queryOptions}
        resultId={resultId}
        {...props}
      />
    </StoreConnector>
  );
}

Plugin.displayName = 'QueryBarPlugin';
Plugin.propTypes = {
  actions: PropTypes.object.isRequired,
  onApply: PropTypes.func,
  onReset: PropTypes.func,
  queryOptions: PropTypes.arrayOf(PropTypes.string),
  resultId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  showExportToLanguageButton: PropTypes.bool,
  showQueryHistoryButton: PropTypes.bool,
  store: PropTypes.object.isRequired,
};

export default Plugin;
export { Plugin };

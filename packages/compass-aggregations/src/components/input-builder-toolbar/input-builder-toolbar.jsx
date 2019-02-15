import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import InputCollapser from 'components/input-collapser';
import InputDocumentsCount from 'components/input-documents-count';
import InputRefresh from 'components/input-refresh';

import styles from './input-builder-toolbar.less';

/**
 * The input builder toolbar component.
 */
class InputBuilderToolbar extends PureComponent {
  static displayName = 'InputBuilderToolbar';

  static propTypes = {
    toggleInputDocumentsCollapsed: PropTypes.func.isRequired,
    refreshInputDocuments: PropTypes.func.isRequired,
    isExpanded: PropTypes.bool.isRequired,
    count: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired
  };

  /**
   * Renders the input builder toolbar.
   *
   * @returns {React.Component} The component.
   */
  render() {
    return (
      <div className={classnames(styles['input-builder-toolbar'])}>
        <InputCollapser
          toggleInputDocumentsCollapsed={
            this.props.toggleInputDocumentsCollapsed
          }
          isExpanded={this.props.isExpanded}
        />
        <InputDocumentsCount count={this.props.count} />
        <InputRefresh
          refreshInputDocuments={this.props.refreshInputDocuments}
        />
      </div>
    );
  }
}

export default InputBuilderToolbar;

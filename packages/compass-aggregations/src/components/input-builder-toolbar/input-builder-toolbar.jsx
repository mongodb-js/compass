import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import InputCollapser from '../input-collapser';
import InputDocumentsCount from '../input-documents-count';
import InputRefresh from '../input-refresh';

import styles from './input-builder-toolbar.module.less';

/**
 * The input builder toolbar component.
 */
class InputBuilderToolbar extends PureComponent {
  static displayName = 'InputBuilderToolbar';

  static propTypes = {
    toggleInputDocumentsCollapsed: PropTypes.func.isRequired,
    refreshInputDocuments: PropTypes.func.isRequired,
    isExpanded: PropTypes.bool.isRequired,
    count: PropTypes.number
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

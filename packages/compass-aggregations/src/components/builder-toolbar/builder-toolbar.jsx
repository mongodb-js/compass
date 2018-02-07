import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import { ViewSwitcher } from 'hadron-react-components';
import { TextButton, IconButton } from 'hadron-react-buttons';
import { CODE, BUILDER } from 'modules/view';

import styles from './builder-toolbar.less';

/**
 * The builder toolbar component.
 */
class BuilderToolbar extends PureComponent {
  static displayName = 'BuilderToolbarComponent';

  static propTypes = {
    view: PropTypes.string.isRequired,
    stageAdded: PropTypes.func.isRequired,
    viewChanged: PropTypes.func.isRequired,
    copyToClipboard: PropTypes.func.isRequired
  }

  /**
   * Renders the builder toolbar.
   *
   * @returns {React.Component} The component.
   */
  render() {
    const addStageClassName = classnames({
      'btn': true,
      'btn-xs': true,
      'btn-default': true,
      [ styles['builder-toolbar-add-stage-button'] ]: true
    });

    const copyToClipboardClassName = classnames({
      'btn': true,
      'btn-xs': true,
      'btn-default': true,
      [ styles['builder-toolbar-copy-to-clipboard-button'] ]: true
    });
    return (
      <div className={classnames(styles['builder-toolbar'])}>
        <ViewSwitcher
          label="VIEW"
          buttonLabels={[ CODE, BUILDER ]}
          activeButton={this.props.view}
          onClick={this.props.viewChanged} />
        <TextButton
          text="Add Stage"
          className={addStageClassName}
          clickHandler={this.props.stageAdded} />
        <IconButton
          title="Copy to Clipboard"
          className={copyToClipboardClassName}
          iconClassName="fa fa-clipboard"
          clickHandler={this.props.copyToClipboard} />
      </div>
    );
  }
}

export default BuilderToolbar;

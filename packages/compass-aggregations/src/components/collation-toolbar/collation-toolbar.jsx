import React, { PureComponent } from 'react';
import { shell } from 'electron';
import { InfoSprinkle } from 'hadron-react-components';
// import PropTypes from 'prop-types';
import classnames from 'classnames';
import OptionEditor from 'components/option-editor';

import styles from './collation-toolbar.less';

/**
 * The help URL for collation.
 */
const HELP_URL_COLLATION = 'https://docs.mongodb.com/master/reference/collation/';

/**
 * The collation toolbar component.
 */
class CollationToolbar extends PureComponent {
  static displayName = 'CollationToolbarComponent';

  /**
   * Renders the collation toolbar.
   *
   * @returns {React.Component} The component.
   */
  render() {
    return (
      <div className={classnames(styles['collation-toolbar'])}>
        <div className={classnames(styles['collation-toolbar-input-wrapper'])}>
          <div
            className={classnames(styles['collation-toolbar-input-label'])}
            data-test-id="collation-toolbar-input-label">
            <InfoSprinkle helpLink={HELP_URL_COLLATION} onClickHandler={shell.openExternal} />
            Collation
          </div>
          <OptionEditor
            label="{ field: 'value' }"
            value=""
            serverVersion=""
            onChange={() => {}}
            onApply={() => {}}
            autoPopulated=""
            actions={{}}
            schemaFields={[]} />
        </div>
      </div>
    );
  }
}

export default CollationToolbar;

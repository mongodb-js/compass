import React, { Component } from 'react';
import classnames from 'classnames';
import PropTypes from 'prop-types';
import { ZeroState, StatusRow } from 'hadron-react-components';
import { TextButton } from 'hadron-react-buttons';
import ValidationEditor from 'components/validation-editor';
import SampleDocuments from 'components/sample-documents';
import { ZeroGraphic } from 'components/zero-graphic';
import semver from 'semver';

import styles from './validation-states.less';

/**
 * The lowest supported version.
 */
const MIN_VERSION = '3.2.0';

/**
 * Read only warning for the banner.
 */
const READ_ONLY_WARNING = 'Schema validation on readonly views are not supported.';

/**
 * Version warning for the banner.
 */
const VERSION_WARNING = 'Compass no longer supports the visual rule builder for server versions below 3.2. To use the visual rule builder, please';

/**
 * Header for zero state.
 */
const HEADER = 'Add validation rules';

/**
 * Additional text for zero state.
 */
const SUBTEXT = 'Create rules to enforce data structure of documents on updates and inserts.';

/**
 * Link to the schema validation documentation.
 */
const DOC_SCHEMA_VALIDATION = 'https://docs.mongodb.com/manual/core/schema-validation/';

/**
 * Link to the upgrading to the latest revision documentation.
 */
const DOC_UPGRADE_REVISION = 'https://docs.mongodb.com/manual/tutorial/upgrade-revision/';

/**
 * The ValidationStates component.
 */
class ValidationStates extends Component {
  static displayName = 'ValidationStates';

  static propTypes = {
    isZeroState: PropTypes.bool.isRequired,
    changeZeroState: PropTypes.func.isRequired,
    zeroStateChanged: PropTypes.func.isRequired,
    isEditable: PropTypes.bool.isRequired,
    openLink: PropTypes.func.isRequired,
    serverVersion: PropTypes.string.isRequired
  }

  /**
   * Checks if it is a proper server version.
   *
   * @returns {Boolean}
   */
  isProperServerVersion() {
    return semver.gte(this.props.serverVersion, MIN_VERSION);
  }

  /**
   * Checks if the zero state window should be displayed.
   *
   * @returns {Boolean}
   */
  checkIfZeroState() {
    return (this.props.isZeroState || !this.props.isEditable);
  }

  /**
   * Renders the banner if the validatiion is not editable.
   *
   * @returns {React.Component} The component.
   */
  renderBanner() {
    if (!this.props.isEditable) {
      if (this.isProperServerVersion()) {
        return (<StatusRow style="warning">{READ_ONLY_WARNING}</StatusRow>);
      }

      return (
        <StatusRow style="warning">
          {VERSION_WARNING}
          <div>&nbsp;</div>
          <a
            className={classnames(styles['upgrade-link'])}
            onClick={this.props.openLink.bind(this, DOC_UPGRADE_REVISION)}
          >
            upgrade to MongoDB 3.2.
          </a>
        </StatusRow>
      );
    }
  }

  /**
   * Renders the schema validation zero state.
   *
   * @returns {React.Component} The component.
   */
  renderZeroState() {
    if (this.checkIfZeroState()) {
      return (
          <div className={classnames(styles['zero-state-container'])}>
            <ZeroGraphic />
            <ZeroState header={HEADER} subtext={SUBTEXT}>
              <div className={classnames(styles['zero-state-action'])}>
                <div>
                  <TextButton
                    className={`btn btn-primary btn-lg ${
                      !this.props.isEditable ? 'disabled' : ''
                    }`}
                    text="Add Rule"
                    clickHandler={this.props.changeZeroState} />
                </div>
                <a
                  className={classnames(styles['zero-state-link'])}
                  onClick={this.props.openLink.bind(this, DOC_SCHEMA_VALIDATION)}
                >
                  Learn more about validations
                </a>
              </div>
            </ZeroState>
        </div>
      );
    }
  }

  /**
   * Renders the schema validation content.
   *
   * @returns {React.Component} The component.
   */
  renderContent() {
    if (!this.checkIfZeroState()) {
      return (
        <div className={classnames(styles['content-container'])}>
          <ValidationEditor {...this.props} />
          <SampleDocuments {...this.props} />
        </div>
      );
    }
  }

  /**
   * Renders the ValidationStates component.
   *
   * @returns {React.Component} The component.
   */
  render() {
    return (
      <div className={classnames(styles['validation-states'])}>
        {this.renderBanner()}
        {this.renderZeroState()}
        {this.renderContent()}
      </div>
    );
  }
}

export default ValidationStates;

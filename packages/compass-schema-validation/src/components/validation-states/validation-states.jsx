import React, { Component } from 'react';
import classnames from 'classnames';
import PropTypes from 'prop-types';
import { ZeroState, StatusRow } from 'hadron-react-components';
import { TextButton } from 'hadron-react-buttons';
import ValidationEditor from 'components/validation-editor';
import SampleDocuments from 'components/sample-documents';
import { ZeroGraphic } from 'components/zero-graphic';

import styles from './validation-states.less';

/**
 * Warnings for the banner.
 */
export const READ_ONLY_WARNING = {
  collectionReadOnly: 'Schema validation on readonly views are not supported.',
  writeStateStoreReadOnly: 'This action is not available on a secondary node.',
  oldServerReadOnly: 'Compass no longer supports the visual rule builder for server versions below 3.2. To use the visual rule builder, please'
};

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
    editMode: PropTypes.object.isRequired,
    openLink: PropTypes.func.isRequired,
    serverVersion: PropTypes.string
  }

  /**
   * Checks if the validation is editable.
   *
   * @returns {Boolean} True if it is editable.
   */
  isEditable() {
    return (
      !this.props.editMode.collectionReadOnly &&
      !this.props.editMode.hardonReadOnly &&
      !this.props.editMode.writeStateStoreReadOnly &&
      !this.props.editMode.oldServerReadOnly
    );
  }

  /**
   * Renders the banner if the validatiion is not editable.
   *
   * @returns {React.Component} The component.
   */
  renderBanner() {
    if (!this.isEditable()) {
      if (this.props.editMode.collectionReadOnly) {
        return (
          <StatusRow style="warning">
            <div id="collectionReadOnly">
              {READ_ONLY_WARNING.collectionReadOnly}
            </div>
          </StatusRow>
        );
      }

      if (this.props.editMode.writeStateStoreReadOnly) {
        return (
          <StatusRow style="warning">
            <div id="writeStateStoreReadOnly">
              {READ_ONLY_WARNING.writeStateStoreReadOnly}
            </div>
          </StatusRow>
        );
      }

      if (this.props.editMode.oldServerReadOnly) {
        return (
          <StatusRow style="warning">
            <div id="oldServerReadOnly">
              {READ_ONLY_WARNING.oldServerReadOnly}
              <div>&nbsp;</div>
              <a
                className={classnames(styles['upgrade-link'])}
                onClick={this.props.openLink.bind(this, DOC_UPGRADE_REVISION)}
              >
                upgrade to MongoDB 3.2.
              </a>
            </div>
          </StatusRow>
        );
      }
    }
  }

  /**
   * Renders the schema validation zero state.
   *
   * @returns {React.Component} The component.
   */
  renderZeroState() {
    if (this.props.isZeroState) {
      return (
          <div className={classnames(styles['zero-state-container'])}>
            <ZeroGraphic />
            <ZeroState header={HEADER} subtext={SUBTEXT}>
              <div className={classnames(styles['zero-state-action'])}>
                <div>
                  <TextButton
                    className={`btn btn-primary btn-lg ${
                      !this.isEditable() ? 'disabled' : ''
                    }`}
                    text="Add Rule"
                    clickHandler={this.props.changeZeroState.bind(this, false)} />
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
    if (!this.props.isZeroState) {
      return (
        <div className={classnames(styles['content-container'])}>
          <ValidationEditor {...this.props} isEditable={this.isEditable()} />
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

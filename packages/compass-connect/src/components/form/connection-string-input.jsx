import React from 'react';
import PropTypes from 'prop-types';
import { InfoSprinkle } from 'hadron-react-components';
import { debounce } from 'lodash';
import classnames from 'classnames';

import Actions from '../../actions';

import styles from '../connect.less';

/**
 * A connection string placeholder.
 */
const PLACEHOLDER =
  'e.g. mongodb+srv://username:password@cluster0-jtpxd.mongodb.net/admin';

/**
 * A link for the info sprinkle.
 */
const CONNECTION_STRING_LINK =
  'https://docs.mongodb.com/manual/reference/connection-string/';

class ConnectionStringInput extends React.PureComponent {
  static displayName = 'DriverUrlInput';

  static propTypes = {
    customUrl: PropTypes.string,
    isURIEditable: PropTypes.bool
  };

  constructor(props) {
    super(props);
    this.validateConnectionString = debounce(
      Actions.validateConnectionString,
      550
    );
  }

  /**
   * Visits external page.
   */
  onExternalLinkClicked() {
    Actions.onExternalLinkClicked(CONNECTION_STRING_LINK);
  }

  /**
   * Handles a connection string change.
   *
   * @param {Object} evt - evt.
   */
  onCustomUrlChanged(evt) {
    const customUrl = evt.target.value.trim();

    Actions.onCustomUrlChanged(customUrl);

    this.validateConnectionString();
  }

  /**
   * Gets customUrl.
   *
   * @returns {String} customUrl.
   */
  getCustomUrl() {
    return this.props.customUrl;
  }

  render() {
    const className = classnames({
      [styles['form-control']]: true,
      [styles['disabled-uri']]: !this.props.isURIEditable
    });
    const title = this.props.isURIEditable ? (
      <span>
        Paste your connection string (SRV or Standard{' '}
        <InfoSprinkle
          helpLink={CONNECTION_STRING_LINK}
          onClickHandler={this.onExternalLinkClicked.bind(this)}
        />
        )
      </span>
    ) : (
      <span>
        Click edit to modify your connection string (SRV or Standard{' '}
        <InfoSprinkle
          helpLink={CONNECTION_STRING_LINK}
          onClickHandler={this.onExternalLinkClicked.bind(this)}
        />
        )
      </span>
    );

    return (
      <div className={classnames(styles['connect-string-item'])}>
        <label>{title}</label>
        <input
          disabled={!this.props.isURIEditable}
          name="connectionString"
          placeholder={PLACEHOLDER}
          className={className}
          value={this.getCustomUrl()}
          onChange={this.onCustomUrlChanged.bind(this)}
        />
      </div>
    );
  }
}

export default ConnectionStringInput;

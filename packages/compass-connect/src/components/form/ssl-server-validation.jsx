import classnames from 'classnames';
import React from 'react';
import PropTypes from 'prop-types';
import { isEmpty } from 'lodash';

import Actions from '../../actions';
import FormFileInput from './form-file-input';

import styles from '../connect.less';

class SSLServerValidation extends React.Component {
  static displayName = 'SSLServerValidation';

  static propTypes = {
    currentConnection: PropTypes.object.isRequired,
    isValid: PropTypes.bool
  };

  /**
   * Handles sslCA change.
   *
   * @param {Object} evt - evt.
   */
  onSSLCAChanged(evt) {
    Actions.onSSLCAChanged(evt);
  }

  /**
   * Checks if sslCA is invalid or empty.
   *
   * @returns {String} In case of error returns an error message.
   */
  getError() {
    const connection = this.props.currentConnection;

    if (!this.props.isValid && isEmpty(connection.sslCA)) {
      return true;
    }
  }

  render() {
    return (
      <div
        id="ssl-server-validation"
        className={classnames(styles['form-group'])}>
        <FormFileInput
          label="Certificate Authority"
          changeHandler={this.onSSLCAChanged.bind(this)}
          values={this.props.currentConnection.sslCA}
          error={this.getError()}
          link="https://docs.mongodb.com/manual/tutorial/configure-ssl/#certificate-authorities"
          multi
        />
      </div>
    );
  }
}

export default SSLServerValidation;

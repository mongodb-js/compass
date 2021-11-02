import classnames from 'classnames';
import React from 'react';
import PropTypes from 'prop-types';
import { isEmpty } from 'lodash';

import { FileInput } from '@mongodb-js/compass-components';

import Actions from '../../actions';

import styles from '../connect.module.less';

class SSLServerValidation extends React.Component {
  static displayName = 'SSLServerValidation';

  static propTypes = {
    connectionModel: PropTypes.object.isRequired,
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
    const connection = this.props.connectionModel;

    if (!this.props.isValid && isEmpty(connection.sslCA)) {
      return true;
    }
  }

  render() {
    return (
      <div
        id="ssl-server-validation"
        className={classnames(styles['form-group'])}>
        <FileInput
          label="Certificate Authority"
          onChange={this.onSSLCAChanged.bind(this)}
          values={this.props.connectionModel.sslCA}
          error={this.getError()}
          link="https://docs.mongodb.com/manual/tutorial/configure-ssl/#certificate-authorities"
          multi
        />
      </div>
    );
  }
}

export default SSLServerValidation;

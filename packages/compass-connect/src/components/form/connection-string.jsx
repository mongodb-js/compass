import React from 'react';
import PropTypes from 'prop-types';
import FormGroup from './form-group';
import ConnectionStringInput from './connection-string-input';
import FormActions from './form-actions';
import classnames from 'classnames';

import styles from '../connect.less';

class ConnectionString extends React.Component {
  static displayName = 'ConnectionString';

  static propTypes = {
    currentConnection: PropTypes.object.isRequired,
    customUrl: PropTypes.string
  };

  render() {
    return (
      <form
        data-test-id="connect-string"
        className={classnames(styles['connect-string'])}>
        <FormGroup separator>
          <ConnectionStringInput
            lastUsed={this.props.currentConnection.lastUsed}
            driverUrl={this.props.currentConnection.driverUrl}
            customUrl={this.props.customUrl} />
        </FormGroup>
        <FormActions {...this.props } />
      </form>
    );
  }
}

export default ConnectionString;

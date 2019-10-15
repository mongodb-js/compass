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
    customUrl: PropTypes.string,
    isValid: PropTypes.bool,
    isConnected: PropTypes.bool,
    errorMessage: PropTypes.string,
    syntaxErrorMessage: PropTypes.string,
    hasUnsavedChanges: PropTypes.bool,
    viewType: PropTypes.string
  };

  render() {
    return (
      <form
        data-test-id="connect-string"
        className={classnames(styles['connect-string'])}>
        <FormGroup separator>
          <ConnectionStringInput customUrl={this.props.customUrl} />
        </FormGroup>
        <FormActions
          currentConnection={this.props.currentConnection}
          isValid={this.props.isValid}
          isConnected={this.props.isConnected}
          errorMessage={this.props.errorMessage}
          syntaxErrorMessage={this.props.syntaxErrorMessage}
          hasUnsavedChanges={this.props.hasUnsavedChanges}
          viewType={this.props.viewType} />
      </form>
    );
  }
}

export default ConnectionString;

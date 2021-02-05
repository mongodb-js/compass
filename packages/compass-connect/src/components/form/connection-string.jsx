import classnames from 'classnames';
import React from 'react';
import PropTypes from 'prop-types';

import FormGroup from './form-group';
import ConnectionStringInput from './connection-string-input';
import FormActions from './form-actions';

import styles from '../connect.less';

class ConnectionString extends React.Component {
  static displayName = 'ConnectionString';

  static propTypes = {
    currentConnection: PropTypes.object.isRequired,
    customUrl: PropTypes.string,
    isValid: PropTypes.bool,
    isConnected: PropTypes.bool,
    currentConnectionAttempt: PropTypes.object,
    errorMessage: PropTypes.string,
    syntaxErrorMessage: PropTypes.string,
    hasUnsavedChanges: PropTypes.bool,
    viewType: PropTypes.string,
    isURIEditable: PropTypes.bool,
    isSavedConnection: PropTypes.bool
  };

  render() {
    return (
      <form
        data-test-id="connect-string"
        className={classnames(styles['connect-string'])}
      >
        <fieldset disabled={!!this.props.currentConnectionAttempt}>
          <FormGroup separator>
            <ConnectionStringInput
              customUrl={this.props.customUrl}
              isURIEditable={this.props.isURIEditable}
            />
          </FormGroup>
          <FormActions
            currentConnection={this.props.currentConnection}
            isValid={this.props.isValid}
            isConnected={this.props.isConnected}
            currentConnectionAttempt={this.props.currentConnectionAttempt}
            errorMessage={this.props.errorMessage}
            syntaxErrorMessage={this.props.syntaxErrorMessage}
            hasUnsavedChanges={this.props.hasUnsavedChanges}
            viewType={this.props.viewType}
            isURIEditable={this.props.isURIEditable}
            isSavedConnection={this.props.isSavedConnection}
          />
        </fieldset>
      </form>
    );
  }
}

export default ConnectionString;

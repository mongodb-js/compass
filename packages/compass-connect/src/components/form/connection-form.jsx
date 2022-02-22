import classnames from 'classnames';
import PropTypes from 'prop-types';
import React from 'react';

import Actions from '../../actions';
import FormGroup from './form-group';
import HostInput from './host-input';
import PortInput from './port-input';
import SRVInput from './srv-input';
import Authentication from './authentication/authentication';
import ReplicaSetInput from './replica-set-input';
import ReadPreferenceSelect from './read-preference-select';
import SSLMethod from './ssl-method';
import SSHTunnel from './ssh-tunnel';
import FormActions from './form-actions';

import styles from '../connect.module.less';

class ConnectionForm extends React.Component {
  static displayName = 'ConnectionForm';

  static propTypes = {
    connectionModel: PropTypes.object.isRequired,
    currentConnectionAttempt: PropTypes.object,
    isValid: PropTypes.bool.isRequired,
    isHostChanged: PropTypes.bool,
    isPortChanged: PropTypes.bool
  };

  constructor(props) {
    super(props);
    this.state = { activeTab: 0 };
    this.tabs = ['Hostname', 'More Options'];
  }

  /**
   * Resests URL validation if form was changed.
   */
  onConnectionFormChanged() {
    Actions.onConnectionFormChanged();
  }

  /**
   * Handles the tab click.
   *
   * @param {Number} activeTab - The index of the clicked tab.
   * @param {Object} evt - evt.
   */
  onTabClicked(activeTab, evt) {
    evt.preventDefault();

    if (this.state.activeTab === activeTab) {
      return;
    }

    this.setState({ activeTab });
  }

  /**
   * Renders a port input.
   *
   * @returns {React.Component}
   */
  renderPort() {
    if (!this.props.connectionModel.isSrvRecord) {
      return (
        <PortInput
          port={this.props.connectionModel.port}
          isPortChanged={this.props.isPortChanged}
          key={this.props.connectionModel._id}
        />
      );
    }
  }

  /**
   * Renders tabs.
   *
   * @returns {React.Component}
   */
  renderTabs() {
    return (
      <div className={classnames(styles['tabs-header'])}>
        <ul className={classnames(styles['tabs-header-items'])}>
          {this.tabs.map((name, key) => {
            const liClassName = classnames({
              [styles['tabs-header-item']]: true,
              [styles['selected-header-item']]: (this.state.activeTab === key)
            });
            const spanClassName = classnames({
              [styles['tabs-header-item-name']]: true,
              [styles['selected-header-item-name']]: (this.state.activeTab === key)
            });

            return (
              <li
                id={name.replace(/ /g, '_')}
                key={`tab-${name}`}
                data-test-id={`${name.toLowerCase().replace(/ /g, '-')}-tab`}
                onClick={this.onTabClicked.bind(this, key)}
                className={liClassName}>
                <span className={spanClassName} href="#">{name}</span>
              </li>
            );
          })}
        </ul>
      </div>
    );
  }

  /**
   * Renders views.
   *
   * @returns {React.Component}
   */
  renderView() {
    if (this.state.activeTab === 0) {
      return (
        <div className={classnames(styles['tabs-view'])}>
          <div className={classnames(styles['tabs-view-content'])}>
            <div className={classnames(styles['tabs-view-content-form'])}>
              <FormGroup separator>
                <HostInput
                  hostname={this.props.connectionModel.hostname}
                  isHostChanged={this.props.isHostChanged} />
                {this.renderPort()}
                <SRVInput
                  currentConnectionAttempt={this.props.currentConnectionAttempt}
                  isSrvRecord={this.props.connectionModel.isSrvRecord}
                />
              </FormGroup>
              <Authentication
                connectionModel={this.props.connectionModel}
                isValid={this.props.isValid} />
            </div>
          </div>
        </div>
      );
    }

    if (this.state.activeTab === 1) {
      return (
        <div className={classnames(styles['tabs-view'])}>
          <div className={classnames(styles['tabs-view-content'])}>
            <div className={classnames(styles['tabs-view-content-form'], styles['align-right'])}>
              <FormGroup id="read-preference" separator>
                <ReplicaSetInput
                  sshTunnel={this.props.connectionModel.sshTunnel}
                  replicaSet={this.props.connectionModel.replicaSet} />
                <ReadPreferenceSelect
                  readPreference={this.props.connectionModel.readPreference} />
              </FormGroup>
              <SSLMethod {...this.props} />
              <SSHTunnel {...this.props} />
            </div>
          </div>
        </div>
      );
    }
  }

  render() {
    return (
      <form
        data-test-id="connection-form"
        onChange={this.onConnectionFormChanged.bind(this)}
        className={classnames(styles['connect-form'])}
      >
        <fieldset disabled={!!this.props.currentConnectionAttempt}>
          <div className={classnames(styles.tabs)}>
            <div className={classnames(styles['tabs-container'])}>
              {this.renderTabs()}
              {this.renderView()}
            </div>
          </div>
        </fieldset>
        <FormActions {...this.props} />
      </form>
    );
  }
}

export default ConnectionForm;

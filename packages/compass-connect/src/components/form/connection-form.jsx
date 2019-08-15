import React from 'react';
import PropTypes from 'prop-types';
import Actions from 'actions';
import FormGroup from './form-group';
import HostInput from './host-input';
import PortInput from './port-input';
import SRVInput from './srv-input';
import Authentication from './authentication';
import ReplicaSetInput from './replica-set-input';
import ReadPreferenceSelect from './read-preference-select';
import SSLMethod from './ssl-method';
import SSHTunnel from './ssh-tunnel';
import FormActions from './form-actions';
import { TabNavBar } from 'hadron-react-components';
import classnames from 'classnames';

import styles from '../connect.less';

class ConnectionForm extends React.Component {
  static displayName = 'ConnectionForm';

  static propTypes = { currentConnection: PropTypes.object.isRequired };

  constructor(props) {
    super(props);
    this.state = { activeTab: 0 };
    this.tabs = ['Hostname', 'More Options'];
    this.views = [this.renderHostnameTab(), this.renderMoreOptionsTab()];
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
   */
  onTabClicked(activeTab) {
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
    if (!this.props.currentConnection.isSrvRecord) {
      return (
        <PortInput
          lastUsed={this.props.currentConnection.lastUsed}
          port={this.props.currentConnection.port} />
      );
    }
  }

  /**
   * Renders the Hostname tab.
   *
   * @returns {React.Component}
   */
  renderHostnameTab() {
    return (
      <div className={classnames(styles['tab-container'])}>
        <FormGroup separator>
          <HostInput
            lastUsed={this.props.currentConnection.lastUsed}
            hostname={this.props.currentConnection.attributes.hostname} />
          {this.renderPort()}
          <SRVInput isSrvRecord={this.props.currentConnection.isSrvRecord} />
        </FormGroup>
        <Authentication {...this.props} />
      </div>
    );
  }

  /**
   * Renders the More Options tab.
   *
   * @returns {React.Component}
   */
  renderMoreOptionsTab() {
    return (
      <div className={classnames(styles['tab-container'])}>
        <FormGroup id="read-preference" separator>
          <ReplicaSetInput
            sshTunnel={this.props.currentConnection.sshTunnel}
            replicaSet={this.props.currentConnection.replicaSet} />
          <ReadPreferenceSelect
            readPreference={this.props.currentConnection.readPreference} />
        </FormGroup>
        <SSLMethod {...this.props} />
        <SSHTunnel {...this.props} />
      </div>
    );
  }

  render() {
    return (
      <form
        onChange={this.onConnectionFormChanged.bind(this)}
        className={classnames(styles['connect-form'])} >
        <div className="rtss">
          <TabNavBar
            theme="light"
            tabs={this.tabs}
            views={this.views}
            activeTabIndex={this.state.activeTab}
            onTabClicked={this.onTabClicked.bind(this)}
            mountAllViews={false} />
        </div>
        <FormActions {...this.props } />
      </form>
    );
  }
}

export default ConnectionForm;

import { connect } from 'react-redux';
import type { State } from './stores';
import { emitChangeTab } from './stores';
import { InstanceComponent } from './components/instance';

const ConnectedInstanceComponent = connect((state: State) => state, {
  onTabClick: emitChangeTab,
})(InstanceComponent);

export default ConnectedInstanceComponent;

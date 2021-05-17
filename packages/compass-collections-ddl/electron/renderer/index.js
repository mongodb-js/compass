import React from 'react';
import ReactDOM from 'react-dom';
import app from 'hadron-app';
import AppRegistry from 'hadron-app-registry';
import { AppContainer } from 'react-hot-loader';
import DatabasePlugin, { activate } from 'plugin';
import { NamespaceStore } from 'mongodb-reflux-store';
import CollectionStore from './stores/collection-store';
import CollectionModel from 'mongodb-collection-model';
import CreateCollectionPlugin from 'components/create-collection-plugin';
import DropCollectionPlugin from 'components/drop-collection-plugin';
import PropTypes from 'prop-types';
import { TextButton } from 'hadron-react-buttons';
import { Tooltip } from 'hadron-react-components';


/**
 * The wrapper class.
 */
const WRAPPER = 'tooltip-button-wrapper';

/**
 * Button component that is aware of the write state of the application.
 * This button contains only text, no icons, no animations.
 */
class TextWriteButton extends React.Component {
  static displayName = 'TextWriteButton';

  static propTypes = {
    className: PropTypes.string.isRequired,
    clickHandler: PropTypes.func.isRequired,
    dataTestId: PropTypes.string,
    isCollectionLevel: PropTypes.bool,
    text: PropTypes.string.isRequired,
    tooltipId: PropTypes.string.isRequired
  }

  /**
   * Subscribe to the state changing stores.
   */
  componentDidMount() {
  }

  /**
   * Unsubscribe from the stores.
   */
  componentWillUnmount() {
    this.unsubscribeWriteState();
  }

  /**
   * Determine if the application is in a writable state.
   *
   * @returns {Boolean} If the application is writable.
   */
  isWritable() {
    const isWritable = true;
    return isWritable;
  }

  /**
   * Handle write state changes.
   *
   * @param {Object} state - The write state.
   */
  writeStateChanged(state) {
    this.setState(state);
  }

  /**
   * Get the tooltip text.
   *
   * @returns {String} The tooltip text.
   */
  tooltipText() {
    if (!this.isWritable()) {
      return 'Not writable';
    }
  }

  /**
   * Render the component.
   *
   * @returns {React.Component} The rendered component.
   */
  render() {
    const tooltip = (this.isWritable()) ? null : (<Tooltip id={this.props.tooltipId} />);
    return (
      <div className={WRAPPER} data-tip={this.tooltipText()} data-for={this.props.tooltipId}>
        <TextButton
          className={this.props.className}
          dataTestId={this.props.dataTestId}
          disabled={!this.isWritable()}
          clickHandler={this.props.clickHandler}
          text={this.props.text} />
        {tooltip}
      </div>
    );
  }
}

export default TextWriteButton;


// Import global less file. Note: these styles WILL NOT be used in compass, as compass provides its own set
// of global styles. If you are wishing to style a given component, you should be writing a less file per
// component as per the CSS Modules ICSS spec. @see src/components/toggle-button for an example.
import 'bootstrap/less/bootstrap.less';
import 'less/index.less';

const appRegistry = new AppRegistry();

global.hadronApp = app;
global.hadronApp.appRegistry = appRegistry;

appRegistry.registerStore('App.NamespaceStore', NamespaceStore);
appRegistry.registerStore('App.CollectionStore', CollectionStore);
appRegistry.registerComponent('DeploymentAwareness.TextWriteButton', TextWriteButton);

// Activate our plugin with the Hadron App Registry
activate(appRegistry);
appRegistry.onActivated();

// Since we are using HtmlWebpackPlugin WITHOUT a template,
// we should create our own root node in the body element before rendering into it.
const root = document.createElement('div');
root.id = 'root';
document.body.appendChild(root);

// Create a HMR enabled render function
const render = Component => {
  ReactDOM.render(
    <AppContainer>
      <div>
        <Component />
        <CreateCollectionPlugin />
        <DropCollectionPlugin />
      </div>
    </AppContainer>,
    document.getElementById('root')
  );
};

// For initialization events to happen in isolation, uncomment the
// following lines as needed in the same places they are commented out.
//
// // Application was initialized.
// appRegistry.emit('application-initialized', '1.11.0-dev');

// Render our plugin - don't remove the following line.
render(DatabasePlugin);

// // Data service initialization and connection.
import Connection from 'mongodb-connection-model';
import DataService from 'mongodb-data-service';

const connection = new Connection({
  hostname: 'localhost',
  port: 27017,
  ns: 'test'
});

console.log('***', 'here0', connection);
const dataService = new DataService(connection);

appRegistry.emit('data-service-initialized', dataService);
dataService.connect((error, ds) => {
  console.log('***', 'here1');
  appRegistry.emit('data-service-connected', error, ds);
  dataService.instance({}, (err, data) => {
    console.log('***', 'here2', data.databases);

    const dbs = data.databases;
    dbs.forEach((db) => {
      db.collections = db.collections.map((collection) => {
        return new CollectionModel(collection);
      });
    });

    if (err) console.log(err);
    appRegistry.emit('instance-refreshed', {
      instance: {
        databases: {
          models: dbs
        },
        dataLake: { isDataLake: false }
      }
    });
    appRegistry.emit('database-changed', 'test');
  });
});

if (module.hot) {
  /**
   * Warning from React Router, caused by react-hot-loader.
   * The warning can be safely ignored, so filter it from the console.
   * Otherwise you'll see it every time something changes.
   * See https://github.com/gaearon/react-hot-loader/issues/298
   */
  const orgError = console.error; // eslint-disable-line no-console
  console.error = (message) => { // eslint-disable-line no-console
    if (message && message.indexOf('You cannot change <Router routes>;') === -1) {
      // Log the error as normally
      orgError.apply(console, [message]);
    }
  };

  module.hot.accept('plugin', () => {
    // Because Webpack 2 has built-in support for ES2015 modules,
    // you won't need to re-require your app root in module.hot.accept
    render(DatabasePlugin);
  });
}

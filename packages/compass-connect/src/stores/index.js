const electron = require('electron');
const ipc = require('hadron-ipc');
const { sortBy, forEach, omit } = require('lodash');
const DataService = require('mongodb-data-service');
const Connection = require('mongodb-connection-model');
const Reflux = require('reflux');
const StateMixin = require('reflux-state-mixin');
const { promisify } = require('util');

const Actions = require('../actions');
const {
  CONNECTION_FORM_VIEW,
  CONNECTION_STRING_VIEW
} = require('../constants/connection-views');

const ConnectionCollection = Connection.ConnectionCollection;
const userAgent = navigator.userAgent.toLowerCase();

/**
 * A default driverUrl.
 */
const DEFAULT_DRIVER_URL =
  'mongodb://localhost:27017/?readPreference=primary&ssl=false';

/**
 * All the authentication strategy related fields on the connection model, with
 * the exception of the method.
 */
const AUTH_FIELDS = [
  'mongodbUsername',
  'mongodbPassword',
  'mongodbDatabaseName',
  'kerberosPrincipal',
  'kerberosServiceName',
  'x509Username',
  'ldapUsername',
  'ldapPassword'
];

/**
 * All the SSL related fields on the connection model, with the exception
 * of the method.
 */
const SSL_FIELDS = ['sslCA', 'sslCert', 'sslKey', 'sslPass'];

/**
 * All the ssh tunnel related fields on the connection model, with the
 * exception of the method.
 */
const SSH_TUNNEL_FIELDS = [
  'sshTunnelHostname',
  'sshTunnelPort',
  'sshTunnelBindToLocalPort',
  'sshTunnelUsername',
  'sshTunnelPassword',
  'sshTunnelIdentityFile',
  'sshTunnelPassphrase',
  'replicaSet'
];

/**
 * The role name for plugin extensions.
 */
const EXTENSION = 'Connect.Extension';


/**
 * The store that backs the connect plugin.
 */
const Store = Reflux.createStore({
  mixins: [StateMixin.store],
  listenables: Actions,

  /** --- Reflux lifecycle methods ---  */

  /**
   * Fetch all the connections on init.
   */
  init() {
    this.state.fetchedConnections.fetch({
      success: () => {
        this.state.fetchedConnections.forEach((item) => {
          this.state.connections[item._id] = { ...item._values };
        });
        this.trigger(this.state);
      }
    });
    ipc.on('app:disconnect', this.onDisconnectClicked.bind(this));
  },

  /**
   * On activation of the app registry, we search for extensions defined by plugins
   * and execute their extension functions with the store instance and the actions.
   *
   * @param {AppRegistry} appRegistry - The app registry.
   */
  onActivated(appRegistry) {
    const role = appRegistry.getRole(EXTENSION) || [];

    forEach(role, (extension) => extension(this));

    this.StatusActions = appRegistry.getAction('Status.Actions');
    this.appRegistry = appRegistry;

    appRegistry.on('clear-current-favorite', () => {
      const ConnectStore = appRegistry.getStore('Connect.Store');

      ConnectStore.state.currentConnection = new Connection();
    });
  },

  /**
   * Gets the initial state of the store.
   *
   * @returns {Object} The state.
   */
  getInitialState() {
    return {
      currentConnection: new Connection(),
      // Collection that contains the current state of connections
      fetchedConnections: new ConnectionCollection(),
      // Hash for storing unchanged connections for the discard feature
      connections: {},
      // URL from connection string input
      customUrl: '',
      isValid: true,
      isConnected: false,
      errorMessage: null,
      syntaxErrorMessage: null,
      hasUnsavedChanges: false,
      viewType: CONNECTION_STRING_VIEW,
      isHostChanged: false,
      isPortChanged: false,
      isModalVisible: false,
      isMessageVisible: false,
      isURIEditable: true,
      isEditURIConfirm: false,
      isSavedConnection: false,
      savedMessage: 'Saved to favorites'
    };
  },

  /** --- Reflux actions ---  */

  /**
   * Hides the favorite message.
   */
  hideFavoriteMessage() {
    this.setState({ isMessageVisible: false });
  },

  /**
   * Hides the favorite modal.
   */
  hideFavoriteModal() {
    this.setState({ isModalVisible: false });
  },

  /**
   * Shows the favorite message.
   */
  showFavoriteMessage() {
    this.setState({ isModalVisible: true });
  },

  /**
   * Shows the favorite modal.
   */
  showFavoriteModal() {
    this.state.isModalVisible = true;
    this.trigger(this.state);
  },

  /**
   * Validates a connection string.
   */
  async validateConnectionString() {
    const customUrl = this.state.customUrl;
    const currentConnection = this.state.currentConnection;
    const currentSaved = this.state.connections[currentConnection._id];

    this.state.hasUnsavedChanges = !!currentSaved;

    if (customUrl === '') {
      this._clearForm();
      this._clearConnection();

      return;
    }

    if (!Connection.isURI(customUrl)) {
      this._setSyntaxErrorMessage(
        'Invalid schema, expected `mongodb` or `mongodb+srv`'
      );

      return;
    }

    try {
      const buildConnectionModelFromUrl = promisify(Connection.from);
      await buildConnectionModelFromUrl(customUrl);

      this._resetSyntaxErrorMessage();
    } catch (error) {
      this._setSyntaxErrorMessage(error.message);
    }
  },

  /**
   * Changes the auth source.
   *
   * @param {String} authSource - The auth source.
   */
  onAuthSourceChanged(authSource) {
    this.state.currentConnection.mongodbDatabaseName = authSource;
    this.trigger(this.state);
  },

  /**
   * Changes authStrategy
   *
   * @param {String} method - The auth strategy.
   */
  onAuthStrategyChanged(method) {
    this._clearAuthFields();
    this.state.currentConnection.authStrategy = method;
    this.trigger(this.state);
  },

  /**
   * Changes viewType and parses URI to fill in a connection form.
   *
   * @param {String} viewType - A view type.
   */
  async onChangeViewClicked(viewType) {
    this.state.viewType = viewType;

    // Target view
    if (viewType === CONNECTION_FORM_VIEW) {
      await this._onViewChangedToConnectionForm();
    } else if (viewType === CONNECTION_STRING_VIEW) {
      await this._onViewChangedToConnectionString();
    }

    this.trigger(this.state);
  },

  /**
   * Resests URL validation.
   */
  onConnectionFormChanged() {
    const currentConnection = this.state.currentConnection;
    const currentSaved = this.state.connections[currentConnection._id];

    this.setState({
      isValid: true,
      errorMessage: null,
      syntaxErrorMessage: null,
      hasUnsavedChanges: !!currentSaved
    });
  },

  /**
   * To connect through `DataService` we need a proper connection object.
   * In case of connecting via URI we need to parse URI first to get this object.
   * In case of connecting via the form we can skip a parsing stage and
   * validate instead the existing connection object.
   */
  async onConnectClicked() {
    this.StatusActions.showIndeterminateProgressBar();

    try {
      if (this.state.viewType === CONNECTION_STRING_VIEW) {
        await this._connectWithConnectionString();
      } else if (this.state.viewType === CONNECTION_FORM_VIEW) {
        await this._connectWithConnectionForm();
      }
    } catch (error) {
      this.setState({
        isValid: false,
        errorMessage: error.message,
        syntaxErrorMessage: null
      });
    } finally {
      this.StatusActions.done();
    }
  },

  /**
   * Copies a favorite connection.
   *
   * @param {Connection} connection - The favorite connection to copy.
   */
  onDuplicateConnectionClicked(connection) {
    const newConnection = new Connection();

    newConnection.set(omit(connection, ['_id', 'color']));
    newConnection.set({ name: `${connection.name} (copy)`, isFavorite: true });

    this._saveConnection(newConnection);
  },

  /**
   * Discards changes.
   */
  onChangesDiscarded() {
    const connection = this.state.connections[this.state.currentConnection._id];

    this.state.currentConnection.set(connection);

    if (this.state.isURIEditable) {
      this.state.customUrl = this.state.currentConnection.driverUrl;
    } else {
      this.state.customUrl = this.state.currentConnection.safeUrl;
    }

    this.state.hasUnsavedChanges = false;
    this.trigger(this.state);
  },

  /**
   * Makes URI read-only again.
   */
  onHideURIClicked() {
    this.state.isURIEditable = false;
    this.state.customUrl = this.state.currentConnection.safeUrl;
    this.trigger(this.state);
  },

  /**
   * Creates a favorite from the current connection.
   *
   * @param {String} name - The favorite name.
   * @param {Object} color - The favorite color.
   */
  onCreateFavoriteClicked(name, color) {
    this.state.currentConnection.color = color;
    this.state.currentConnection.name = name;
    this.state.isMessageVisible = true;
    this._saveFavorite();
  },

  /**
   * Changes customUrl.
   *
   * @param {String} customUrl - A connection string.
   */
  onCustomUrlChanged(customUrl) {
    this.state.errorMessage = null;
    this.state.syntaxErrorMessage = null;
    this.state.customUrl = customUrl;
    this.trigger(this.state);
  },

  /**
   * Deletes a connection.
   *
   * @param {Connection} connection - The connection to delete.
   */
  onDeleteConnectionClicked(connection) {
    const toDestrioy = this.state.fetchedConnections.find(
      (item) => item._id === connection._id
    );

    toDestrioy.destroy({
      success: () => {
        this.state.fetchedConnections.remove(toDestrioy._id);
        this.state.connections = this._removeFromCollection(connection._id);

        if (connection._id === this.state.currentConnection._id) {
          this.state.currentConnection = new Connection();
        }

        this.trigger(this.state);
      }
    });
  },

  /**
   * Deletes all recents.
   *
   * @param {Connection} connection - Connections to delete.
   */
  onDeleteConnectionsClicked() {
    const recentsKeys = Object.keys(this.state.connections).filter(
      (key) => !this.state.connections[key].isFavorite
    );
    const recentsLength = recentsKeys.length;
    let index = 1;

    recentsKeys.forEach((key) => {
      this.state.connections = this._removeFromCollection(key);

      const toDestrioy = this.state.fetchedConnections.find(
        (item) => item._id === key
      );

      toDestrioy.destroy({
        success: () => {
          this.state.fetchedConnections.remove(toDestrioy._id);

          if (index === recentsLength) {
            this.trigger(this.state);
          }

          index++;
        }
      });
    });
  },

  /**
   * Disconnects the current connection.
   */
  async onDisconnectClicked() {
    if (!this.dataService) {
      return;
    }

    const runDisconnect = promisify(
      this.dataService.disconnect.bind(this.dataService)
    );

    await runDisconnect();

    this.appRegistry.emit('data-service-disconnected');
    this.state.isValid = true;
    this.state.isConnected = false;
    this.state.errorMessage = null;
    this.state.syntaxErrorMessage = null;
    this.state.hasUnsavedChanges = false;
    this._saveConnection(this.state.currentConnection);

    this.dataService = undefined;
  },

  /**
   * Hides a modal with confirmation to proceed.
   */
  onEditURICanceled() {
    this.state.isEditURIConfirm = false;
    this.trigger(this.state);
  },

  /**
   * Shows a modal with confirmation to proceed.
   */
  onEditURIClicked() {
    this.state.isEditURIConfirm = true;
    this.trigger(this.state);
  },

  /**
   * Makes URI editable.
   */
  onEditURIConfirmed() {
    this.state.isURIEditable = true;
    this.state.customUrl = this.state.currentConnection.driverUrl;
    this.state.isEditURIConfirm = false;
    this.trigger(this.state);
  },

  /**
   * Visits external page.
   *
   * @param {String} href - A link to external page.
   * @param {String} event - appRegistry event.
   */
  onExternalLinkClicked(href, event) {
    if (userAgent.indexOf('electron') > -1) {
      const { shell } = electron;

      shell.openExternal(href);
    } else {
      window.open(href, '_new');
    }

    if (event) {
      this.appRegistry.emit(event);
    }
  },

  /**
   * Changes the favorite name.
   *
   * @param {String} name - The favorite name.
   */
  onFavoriteNameChanged(name) {
    this.state.currentConnection.name = name;
    this.trigger(this.state);
  },

  /**
   * Selects a saved connection.
   *
   * @param {Connection} connection - The connection to select.
   */
  onConnectionSelected(connection) {
    this.state.currentConnection.set({ name: 'Local', color: undefined });
    this.state.currentConnection.set(connection);
    this.trigger(this.state);
    this.setState({
      isURIEditable: false,
      isSavedConnection: true,
      isValid: true,
      isConnected: false,
      errorMessage: null,
      syntaxErrorMessage: null,
      isHostChanged: true,
      isPortChanged: true,
      customUrl: this.state.currentConnection.safeUrl,
      hasUnsavedChanges: false
    });
  },

  /**
   * Changes the host name. If the hostname contains mongodb.net then
   * then its an Atlas instance and we change the SSL settings.
   *
   * @param {String} hostname - The hostname.
   */
  onHostnameChanged(hostname) {
    this.state.currentConnection.hostname = hostname.trim();
    this.state.isHostChanged = true;

    if (hostname.match(/mongodb\.net/i)) {
      this.state.currentConnection.sslMethod = 'SYSTEMCA';
    }

    this.trigger(this.state);
  },

  /**
   * Changes the password.
   *
   * @param {String} password - The password.
   */
  onPasswordChanged(password) {
    this.state.currentConnection.mongodbPassword = password;
    this.trigger(this.state);
  },

  /**
   * Changes the port.
   *
   * @param {String} port - The port.
   */
  onPortChanged(port) {
    this.state.currentConnection.port = port;
    this.state.isPortChanged = true;
    this.trigger(this.state);
  },

  /**
   * Changes the read preference.
   *
   * @param {String} readPreference - The read preference.
   */
  onReadPreferenceChanged(readPreference) {
    this.state.currentConnection.readPreference = readPreference;
    this.trigger(this.state);
  },

  /**
   * Changes the replica set name.
   *
   * @param {String} replicaSet - The replica set name.
   */
  onReplicaSetChanged(replicaSet) {
    this.state.currentConnection.replicaSet = replicaSet.trim();
    this.trigger(this.state);
  },

  /**
   * Resets the connection after clicking on the new connection section.
   */
  onResetConnectionClicked() {
    this.state.viewType = CONNECTION_STRING_VIEW;
    this.state.savedMessage = 'Saved to favorites';
    this.state.currentConnection = new Connection();
    this.state.isURIEditable = true;
    this.state.isSavedConnection = false;
    this._clearForm();
    this.trigger(this.state);
  },

  /**
   * Saves a recent connection to favorites.
   *
   * @param {Object} connection - A recent connection.
   */
  onSaveAsFavoriteClicked(connection) {
    this.state.currentConnection.set(connection);
    this.state.isMessageVisible = true;
    this.state.currentConnection.isFavorite = true;
    this.state.currentConnection.name = `${connection.hostname}:${connection.port}`;
    this.state.savedMessage = 'Saved to favorites';
    this._saveConnection(this.state.currentConnection);
  },

  /**
   * Updates favorite attributes if a favorite already exists.
   */
  onSaveFavoriteClicked() {
    this._saveFavorite();
  },

  /**
   * Changes the SSL CA.
   *
   * @param {Array} files - The files.
   */
  onSSLCAChanged(files) {
    this.state.currentConnection.sslCA = files;
    this.trigger(this.state);
  },

  /**
   * Changes the SSL certificate.
   *
   * @param {Array} files - The files.
   */
  onSSLCertificateChanged(files) {
    this.state.currentConnection.sslCert = files;
    this.trigger(this.state);
  },

  /**
   * Changes the SSL method.
   *
   * @param {String} method - The SSL method.
   */
  onSSLMethodChanged(method) {
    this._clearSSLFields();
    this.state.currentConnection.sslMethod = method;
    this.trigger(this.state);
  },

  /**
   * Changes the SSL private key.
   *
   * @param {Array} files - The files.
   */
  onSSLPrivateKeyChanged(files) {
    this.state.currentConnection.sslKey = files;
    this.trigger(this.state);
  },

  /**
   * Changes the SSL password.
   *
   * @param {String} password - The password.
   */
  onSSLPrivateKeyPasswordChanged(password) {
    this.state.currentConnection.sslPass = password;
    this.trigger(this.state);
  },

  /**
   * Changes the SSH tunnel password.
   *
   * @param {String} password - The password.
   */
  onSSHTunnelPasswordChanged(password) {
    this.state.currentConnection.sshTunnelPassword = password;
    this.trigger(this.state);
  },

  /**
   * Changes the SSH tunnel passphrase.
   *
   * @param {String} passphrase - The passphrase.
   */
  onSSHTunnelPassphraseChanged(passphrase) {
    this.state.currentConnection.sshTunnelPassphrase = passphrase;
    this.trigger(this.state);
  },

  /**
   * Changes the SSH tunnel hostname.
   *
   * @param {String} hostname - The hostname.
   */
  onSSHTunnelHostnameChanged(hostname) {
    this.state.currentConnection.sshTunnelHostname = hostname;
    this.trigger(this.state);
  },

  /**
   * Changes the SSH tunnel username.
   *
   * @param {String} username - The username.
   */
  onSSHTunnelUsernameChanged(username) {
    this.state.currentConnection.sshTunnelUsername = username;
    this.trigger(this.state);
  },

  /**
   * Changes the SSH tunnel port.
   *
   * @param {String} port - The port.
   */
  onSSHTunnelPortChanged(port) {
    this.state.currentConnection.sshTunnelPort = port;
    this.trigger(this.state);
  },

  /**
   * Changes the SSH tunnel identity file.
   *
   * @param {Array} files - The file.
   */
  onSSHTunnelIdentityFileChanged(files) {
    this.state.currentConnection.sshTunnelIdentityFile = files;
    this.trigger(this.state);
  },

  /**
   * Changes the SSH tunnel method.
   *
   * @param {String} tunnel - The method.
   */
  onSSHTunnelChanged(tunnel) {
    this._clearSSHTunnelFields();
    this.state.currentConnection.sshTunnel = tunnel;
    this.trigger(this.state);
  },

  /**
   * Changes the srv record flag.
   */
  onSRVRecordToggled() {
    this.state.currentConnection.isSrvRecord = !this.state.currentConnection
      .isSrvRecord;
    this.trigger(this.state);
  },

  /**
   * Changes the username.
   *
   * @param {String} username - The username.
   */
  onUsernameChanged(username) {
    this.state.currentConnection.mongodbUsername = username;
    this.trigger(this.state);
  },

  /** --- Help methods ---  */

  /**
   * Saves a connection in the connections list.
   *
   * @param {Object} connection - A connection.
   */
  _saveConnection(connection) {
    this.state.currentConnection = connection;
    this.state.fetchedConnections.add(connection);
    this.state.connections[connection._id] = { ...connection._values };
    this.state.customUrl = connection.safeUrl;
    this.trigger(this.state);
    connection.save();
  },

  /**
   * Clears authentication fields.
   */
  _clearAuthFields() {
    AUTH_FIELDS.forEach((field) => {
      this.state.currentConnection[field] = undefined;
    });
  },

  /**
   * Clears ssl fields.
   */
  _clearSSLFields() {
    SSL_FIELDS.forEach((field) => {
      this.state.currentConnection[field] = undefined;
    });
  },

  /**
   * Clears SSH tunnel fields.
   */
  _clearSSHTunnelFields() {
    SSH_TUNNEL_FIELDS.forEach((field) => {
      this.state.currentConnection[field] = undefined;
    });
  },

  /**
   * Sets a syntax error message.
   *
   * @param {Object} error - Error.
   */
  _setSyntaxErrorMessage(error) {
    this.state.isValid = false;
    this.state.errorMessage = null;
    this.state.syntaxErrorMessage = error;
    this._clearConnection();
  },

  /**
   * Resets a syntax error message.
   */
  _resetSyntaxErrorMessage() {
    this.state.isValid = true;
    this.state.errorMessage = null;
    this.state.syntaxErrorMessage = null;
    this.trigger(this.state);
  },

  /**
   * Saves the current connection to recents.
   *
   * @param {Object} currentConnection - The current connection.
   */
  _saveRecent(currentConnection) {
    // Keeps 10 recent connections and deletes rest of them.
    let recents = Object.keys(this.state.connections).filter(
      (key) => !this.state.connections[key].isFavorite
    );

    if (recents.length === 10) {
      recents = sortBy(recents, 'lastUsed');
      this.state.connections = this._removeFromCollection(recents[9]);

      const toDestrioy = this.state.fetchedConnections.find(
        (item) => item._id === recents[9]
      );

      toDestrioy.destroy({
        success: () => {
          this.state.fetchedConnections.remove(toDestrioy._id);
          this._saveConnection(currentConnection);
        }
      });
    } else {
      this._saveConnection(currentConnection);
    }
  },

  /**
   * Connects to the current connection. If connection is successful then a new
   * recent connection is created.
   *
   * @param {Object} connection - The current connection.
   */
  async _connect(connection) {
    // Set the connection's app name to the electron app name of Compass.
    connection.appname = electron.remote.app.getName();

    const dataService = new DataService(connection);

    try {
      const runConnect = promisify(dataService.connect.bind(dataService));
      const connectedDataService = await runConnect();

      const currentConnection = this.state.currentConnection;
      const currentSaved = this.state.connections[currentConnection._id];

      this.dataService = dataService;
      this.state.isValid = true;
      this.state.isConnected = true;
      this.state.errorMessage = null;
      this.state.syntaxErrorMessage = null;
      this.state.hasUnsavedChanges = false;
      this.state.isURIEditable = false;
      this.state.customUrl = this.state.currentConnection.driverUrl;

      currentConnection.lastUsed = new Date();

      if (currentSaved) {
        this._saveConnection(currentConnection);
      } else {
        this._saveRecent(currentConnection);
      }

      this.appRegistry.emit(
        'data-service-connected',
        null, // No error connecting.
        connectedDataService
      );
    } catch (error) {
      this.setState({
        isValid: false,
        errorMessage: error.message,
        syntaxErrorMessage: null
      });
    }
  },

  /**
   * Connects to the current connection form connection configuration.
   */
  async _connectWithConnectionForm() {
    const currentConnection = this.state.currentConnection;

    if (!currentConnection.isValid()) {
      const validationError = currentConnection.validate(currentConnection);

      this.setState({
        isValid: false,
        errorMessage: validationError
          ? validationError.message
          : 'The required fields can not be empty'
      });
    } else {
      await this._connect(currentConnection);
    }
  },

  /**
   * Connects to the current connection string connection.
   */
  async _connectWithConnectionString() {
    const currentConnection = this.state.currentConnection;

    // Set the connection's app name to the electron app name
    // of Compass before building the connection string.
    currentConnection.appname = electron.remote.app.getName();

    const url = this.state.isURIEditable
      ? this.state.customUrl || DEFAULT_DRIVER_URL
      : this.state.currentConnection.driverUrl;

    if (!Connection.isURI(url)) {
      this._setSyntaxErrorMessage(
        'Invalid schema, expected `mongodb` or `mongodb+srv`'
      );
      return;
    }

    let parsedConnection;
    try {
      const buildConnectionModelFromUrl = promisify(Connection.from);
      parsedConnection = await buildConnectionModelFromUrl(url);
    } catch (error) {
      this._setSyntaxErrorMessage(error.message);

      return;
    }

    const isFavorite = currentConnection.isFavorite;
    const driverUrl = currentConnection.driverUrl;

    // If we have SSH tunnel attributes, set them here.
    if (currentConnection && currentConnection.sshTunnel !== 'NONE') {
      this._setSshTunnelAttributes(currentConnection, parsedConnection);
    }

    if (currentConnection && currentConnection.sslMethod !== 'NONE') {
      this._setTlsAttributes(currentConnection, parsedConnection);
    }

    if (isFavorite && driverUrl !== parsedConnection.driverUrl) {
      await this._connect(parsedConnection);
    } else {
      currentConnection.set(this._getPoorAttributes(parsedConnection));
      await this._connect(currentConnection);
    }
  },

  /**
   * Clears the current connection.
   */
  _clearConnection() {
    const isFavorite = this.state.currentConnection.isFavorite;
    const name = this.state.currentConnection.name;
    const color = this.state.currentConnection.color;
    const connection = new Connection();

    this.state.currentConnection.set(this._getPoorAttributes(connection));
    this.state.currentConnection.set({ isFavorite, name, color });
    this.trigger(this.state);
  },

  /**
   * Clears the form.
   */
  _clearForm() {
    this.state.isValid = true;
    this.state.isConnected = false;
    this.state.errorMessage = null;
    this.state.syntaxErrorMessage = null;
    this.state.customUrl = '';
    this.state.hasUnsavedChanges = false;
  },

  async _onViewChangedToConnectionForm() {
    const currentConnection = this.state.currentConnection;
    const driverUrl = currentConnection.driverUrl;
    const url = this.state.isURIEditable ? this.state.customUrl : driverUrl;
    const currentSaved = this.state.connections[currentConnection._id];

    if (!currentSaved && url === driverUrl) {
      this.state.isHostChanged = true;
      this.state.isPortChanged = true;
      this.trigger(this.state);

      return;
    } else if (url === '') {
      this.state.isHostChanged = false;
      this.state.isPortChanged = false;
      this._clearForm();
      this._clearConnection();

      return;
    } else if (!Connection.isURI(url)) {
      this._clearConnection();
      this.trigger(this.state);

      return;
    }

    this.StatusActions.showIndeterminateProgressBar();

    try {
      const buildConnectionModelFromUrl = promisify(Connection.from);
      const parsedConnection = await buildConnectionModelFromUrl(url);

      this.StatusActions.done();

      currentConnection.set(this._getPoorAttributes(parsedConnection));

      if (currentSaved) {
        // If we have SSH tunnel attributes, set them here.
        if (currentSaved.sshTunnel !== 'NONE') {
          this._setSshTunnelAttributes(currentSaved, currentConnection);
        }

        // If we have TLS attributes, set them here.
        if (currentSaved.sslMethod !== 'NONE') {
          this._setTlsAttributes(currentSaved, currentConnection);
        }

        currentConnection.name = currentSaved.name;
        currentConnection.color = currentSaved.color;
        currentConnection.lastUsed = currentSaved.lastUsed;
      }

      this.state.isHostChanged = true;
      this.state.isPortChanged = true;
      this.setState({ currentConnection });
      this._resetSyntaxErrorMessage();
    } catch (error) {
      this.StatusActions.done();

      this.state.currentConnection = new Connection();
      this.trigger(this.state);
    }
  },

  _onViewChangedToConnectionString() {
    const currentConnection = this.state.currentConnection;
    const driverUrl = currentConnection.driverUrl;
    const isValid = this.state.isValid;

    if (!this.state.isURIEditable) {
      this.state.customUrl = this.state.currentConnection.safeUrl;
    } else if (
      isValid &&
      (this.state.isHostChanged === true || this.state.isPortChanged === true)
    ) {
      this.state.customUrl = driverUrl;
    }

    this.trigger(this.state);
  },

  /**
   * Persist a favorite on disc.
   */
  async _saveFavorite() {
    const currentConnection = this.state.currentConnection;
    const isFavorite = currentConnection.isFavorite;
    let url = this.state.customUrl;

    if (isFavorite) {
      this.state.savedMessage = 'Favorite is updated';
    }

    if (!this.state.isURIEditable) {
      url = currentConnection.driverUrl;
    }

    currentConnection.isFavorite = true;
    this.state.hasUnsavedChanges = false;
    this.state.isURIEditable = false;

    if (this.state.viewType === CONNECTION_STRING_VIEW) {
      try {
        const buildConnectionModelFromUrl = promisify(Connection.from);
        const parsedConnection = await buildConnectionModelFromUrl(url);

        currentConnection.set(this._getPoorAttributes(parsedConnection));

        if (url.match(/[?&]ssl=true/i)) {
          currentConnection.sslMethod = 'SYSTEMCA';
        }

        this._saveConnection(currentConnection);
      } catch (error) { /* Ignore saving invalid connection string */ }
    } else if (this.state.viewType === CONNECTION_FORM_VIEW) {
      if (!currentConnection.isValid()) {
        const validationError = currentConnection.validate(currentConnection);

        this.setState({
          isValid: false,
          errorMessage: validationError
            ? validationError.message
            : 'The required fields can not be empty'
        });
        return;
      }

      this._saveConnection(currentConnection);
    }
  },

  /**
   * Gets connection attributes without data related to favorites.
   *
   * @param {Connection} connection - The connection to select.
   *
   * @returns {Connection} - The poor connection.
   */
  _getPoorAttributes(connection) {
    return omit(connection.getAttributes({ props: true }), [
      '_id',
      'color',
      'isFavorite',
      'name'
    ]);
  },

  /**
   * Removes a specified by id connection form connections hash.
   *
   * @param {String} connectionId - A connection id.
   * @returns {Object} - The updated connections hash.
   */
  _removeFromCollection(connectionId) {
    return omit(this.state.connections, [connectionId]);
  },

  /**
   * Set SSH tunnel attributes.
   *
   * @param {Connection} currentConnection - The current connection.
   * @param {Connection} parsedConnection - The parsed connection.
   */
  _setSshTunnelAttributes(currentConnection, parsedConnection) {
    if (parsedConnection) {
      SSH_TUNNEL_FIELDS.forEach((field) => {
        parsedConnection[field] = currentConnection[field];
      });
      parsedConnection.sshTunnel = currentConnection.sshTunnel;
    }
  },

  /**
   * Set TLS attributes.
   *
   * @param {Connection} currentConnection - The current connection.
   * @param {Connection} parsedConnection - The parsed connection.
   */
  _setTlsAttributes(currentConnection, parsedConnection) {
    if (parsedConnection) {
      SSL_FIELDS.forEach((field) => {
        parsedConnection[field] = currentConnection[field];
      });
      parsedConnection.sslMethod = currentConnection.sslMethod;
    }
  }
});

module.exports = Store;
module.exports.EXTENSION = EXTENSION;

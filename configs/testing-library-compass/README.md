# @mongodb-js/testing-library-compass

This package provides re-exports for @testing-library/react and @testing-library/react-hooks methods that should ease writing unit and functional tests for UI in the Compass application. As [suggested by testing-library documentation](https://testing-library.com/docs/react-testing-library/setup/#custom-render), all the re-exported render methods provide default wrappers that do a bunch of required context setup for tests that should ease common re-configuration that almost every test would need to do manually.

## render / renderWithConnections

Default `render` / `renderHook` methods will provide a wrapper that sets up the following contexts around the rendered UI or a hook:

- leafygreen and compass components UI wrappers (skipped for hooks due to testing-library limitations)
  - this allows for showConfirmation and openToast methods to actually render in tests and be asserted
- globalAppRegistry
- localAppRegistry
- preferences
- logger
- telemetry
- connections and connection storage

When using the render methods, on top of all of the existing render options that testing-library provides, you can also provide some initial configuration for the contexts and use them in your tests afterwards:

```jsx
import { render, screen, userEvent } from '@mongodb-js/testing-library-compass';

it('should render component', async function () {
  const findStub = sinon.stub.resolves({ _id: '123' });

  const result = render(<Component></Component>, {
    preferences: {
      // If component behavior depends on some preferences value, the initial value
      // can be provided in the configuration object
      enableNewFeature: true,
    },
    // Initial connections that application will be aware of can also be
    // provided in the configuration
    connections: [conn1, conn2, conn3],
    // In cases where you want to mock a certain behavior of DataService for a
    // connected connection or spy on some methods, you can use `connectFn` to
    // provide your own implementation for some DataService methods. By default
    // testing-library-compass will provide a bare minimum amount of mocks for
    // data service implementation so that you can `connect` your mocked render
    // without providing any custom `connectFn`
    connectFn() {
      return {
        find: findStub,
      };
    },
  });

  expect(screen.getBy(/* ... */));

  // You can access various contexts after initial render if you need to test
  // how your component behaves when these contexts are changing

  // For example, you can "connect" to one of the connections that application
  // runtime is aware of if some of the component state depends on this
  await result.connectionsStore.actions.connect(conn1);

  // You can also change preferences and check changes in the UI based on that
  await result.preferences.savePreferences({ networkTraffic: false });

  // If the component state reacts to some appRegistry events (through stores
  // subscribing to those changes for example), you can emit those events
  result.globalAppRegistry.emit('open-modal');
  result.localAppRegistry.emit('refresh-state');

  // Logging and tracking functions are provided as sinon stubs, so you can
  // assert any of the calls to those too if needed
  userEvent.click(screen.getByRole('button', { name: 'Button with tracking' }));

  expect(result.track).to.have.been.calledWith('Button Clicked');
});
```

## renderWithActiveConnection

The `renderWithActiveConnection` (and its hook rendering counterpart) are extending the functionality of the render methods described above, additionally setting up a connected connection context around whatever is being rendered by them. This allows for more straightforward testing of any component in the connected application context:

```jsx
it('should render for connection', async function () {
  // As the connection process is async, you need to await the render method
  const result = await renderWithActiveConnection(
    <Component></Component>,
    // An optional connection info can be provided when connecting if certain
    // component behavior depends on a special connection type being provided in
    // context. Otherwise a default test connection info will be used
    conn1
  );

  expect(screen.getBy(/* ... */));

  // All the properties mentioned above will be also available on the render
  // result
});
```

## createPluginTestHelpers

The `createPluginTestHelpers` method creates a version of test helpers mentioned above bound to the plugin context, meaning that everything that you render with the methods returned from the create helper will be rendered in a properly configured plugin context with the store provider set up:

```jsx
const helpers = createPluginTestHelpers(
  // As this method expects any plugin, you can also pass a result of
  // `Plugin.withMockServices` here allowing you to mock any extra services that
  // plugin expects to be dependency injected
  Plugin,
  {
    // If plugin expects some default initial properties to be passed to the activate method, you can provide them here when creating bound helpers
    namespace: 'a.b',
  }
);

it('should render', function () {
  // You can now render components that are connected to the plugin store inside
  // your test
  const result = helpers.renderWithConnections(
    <ComponentWithState></ComponentWithState>
  );

  // As the plugin is "activated", any subscriptions set up in the activate
  // method will be correctly listening to events now
  result.globalAppRegistry.emit('trigger-something-in-plugin');
});
```

import { makePreferencesIpc } from './renderer-ipc';
import { EventEmitter } from 'events';
import { expect } from 'chai';

describe('Renderer IPC', function () {
  const ipcImpl = {
    'compass:save-preferences'(attributes) {
      return { savePreferences: 1, attributes };
    },
    'compass:get-preferences'() {
      return { getPreferences: 1 };
    },
    'compass:get-configurable-user-preferences'() {
      return { getConfigurableUserPreferences: 1 };
    },
    'compass:get-preference-states'() {
      return { getPreferenceStates: 1 };
    },
  };
  const ipcMock = Object.assign(new EventEmitter(), {
    invoke(method: string, ...args: any[]) {
      return Promise.resolve(ipcImpl[method](...args));
    },
  });
  const preferencesIpc = makePreferencesIpc({ ipcRenderer: ipcMock } as any);

  it('should be able to call savePreferences', async function () {
    expect(
      await preferencesIpc.savePreferences({ enableMaps: true })
    ).to.deep.equal({ savePreferences: 1, attributes: { enableMaps: true } });
  });

  it('should be able to call getPreferences', async function () {
    expect(await preferencesIpc.getPreferences()).to.deep.equal({
      getPreferences: 1,
    });
  });

  it('should be able to call getConfigurableUserPreferences', async function () {
    expect(await preferencesIpc.getConfigurableUserPreferences()).to.deep.equal(
      { getConfigurableUserPreferences: 1 }
    );
  });

  it('should be able to call getPreferenceStates', async function () {
    expect(await preferencesIpc.getPreferenceStates()).to.deep.equal({
      getPreferenceStates: 1,
    });
  });

  it('should be able to listen with onPreferenceValueChanged', function () {
    const calls: any[] = [];
    const unsubscribe = preferencesIpc.onPreferenceValueChanged(
      'enableMaps',
      (value) => calls.push(value)
    );
    ipcMock.emit('compass:preferences-changed', null, {
      trackUserStatistics: false,
    });
    expect(calls).to.deep.equal([]);
    ipcMock.emit('compass:preferences-changed', null, { enableMaps: true });
    expect(calls).to.deep.equal([true]);
    ipcMock.emit('compass:preferences-changed', null, { enableMaps: true });
    expect(calls).to.deep.equal([true, true]);
    unsubscribe();
    ipcMock.emit('compass:preferences-changed', null, { enableMaps: true });
    expect(calls).to.deep.equal([true, true]);
  });
});

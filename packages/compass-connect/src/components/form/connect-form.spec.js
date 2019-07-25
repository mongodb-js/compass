import React from 'react';
import { shallow } from 'enzyme';
import ConnectForm from './connect-form';

describe('HostInput [Component]', () => {
  const connection = {
    authStrategy: 'MONGODB',
    isSrvRecord: false,
    readPreference: 'primaryPreferred',
    attributes: { hostanme: 'localhost' }
  };
  let component;

  beforeEach(() => {
    component = shallow(
      <ConnectForm currentConnection={connection} isValid />
    );
  });

  afterEach(() => {
    component = null;
  });

  it('renders host input', () => {
    const hostInput = component.find('HostInput');

    expect(hostInput).to.be.present();
  });

  it('renders SRV input', () => {
    const hostInput = component.find('SRVInput');

    expect(hostInput).to.be.present();
  });

  it('renders authentication section', () => {
    const hostInput = component.find('Authentication');

    expect(hostInput).to.be.present();
  });

  it('renders replica set input', () => {
    const hostInput = component.find('ReplicaSetInput');

    expect(hostInput).to.be.present();
  });

  it('renders read preference select', () => {
    const hostInput = component.find('ReadPreferenceSelect');

    expect(hostInput).to.be.present();
  });

  it('renders SSLMethod input', () => {
    const hostInput = component.find('SSLMethod');

    expect(hostInput).to.be.present();
  });

  it('renders SSHTunnel input', () => {
    const hostInput = component.find('SSHTunnel');

    expect(hostInput).to.be.present();
  });

  it('renders form actions', () => {
    const hostInput = component.find('FormActions');

    expect(hostInput).to.be.present();
  });
});

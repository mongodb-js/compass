import { shallow } from 'enzyme';
import React from 'react';

import ConnectionString from './connection-string';

import styles from '../connect.less';

describe('ConnectionString [Component]', () => {
  const connection = {
    authStrategy: 'MONGODB',
    isSrvRecord: false,
    readPreference: 'primaryPreferred',
    attributes: { hostanme: 'localhost' }
  };
  const customUrl = 'localhost';
  let component;

  beforeEach(() => {
    component = shallow(
      <ConnectionString
        currentConnection={connection}
        customUrl={customUrl}
        isValid />
    );
  });

  afterEach(() => {
    component = null;
  });

  it('renders a connect string form', () => {
    const connectString = component.find(`.${styles['connect-string']}`);

    expect(connectString).to.be.present();
  });
});

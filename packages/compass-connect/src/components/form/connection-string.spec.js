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
        connectionModel={connection}
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

  it('renders the fieldset enabled', () => {
    expect(component.find('fieldset[disabled=true]')).to.be.not.present();
    expect(component.find('fieldset[disabled=false]')).to.be.present();
  });
  context('when currentConnectionAttempt is not null', () => {
    it('renders the fieldset disabled', () => {
      component.setProps({
        currentConnectionAttempt: true
      });

      expect(component.find('fieldset[disabled=true]')).to.be.present();
      expect(component.find('fieldset[disabled=false]')).to.be.not.present();
    });
  });
});

import React from 'react';
import { shallow } from 'enzyme';
import FavoriteColorPicker from './favorite-color-picker';

import styles from '../connect.less';

describe('FavoriteColorPicker [Component]', () => {
  context('when it is a new connection', () => {
    const spy = sinon.spy();
    const onChange = (evt) => spy(evt);
    let component;

    beforeEach(() => {
      component = shallow(
        <FavoriteColorPicker onChange={onChange} />
      );
    });

    afterEach(() => {
      component = null;
    });

    it('displays the favorite modal', () => {
      const activeBox = component.find(`.${styles['color-box-active']}`);

      expect(component.find(`.${styles['favorite-picker']}`)).to.be.present();
      expect(component.find(`.${styles['color-box']}`)).to.be.present();
      expect(activeBox).to.be.present();
      expect(activeBox.prop('title')).to.equal('No color');
      expect(activeBox).to.have.lengthOf(1);
    });
  });

  context('when it is a saved to favorites connection', () => {
    const spy = sinon.spy();
    const onChange = (evt) => spy(evt);
    const hex = '#5fc86e';
    let component;

    beforeEach(() => {
      component = shallow(
        <FavoriteColorPicker onChange={onChange} hex={hex} />
      );
    });

    afterEach(() => {
      component = null;
    });

    it('displays the favorite modal', () => {
      const activeBox = component.find(`.${styles['color-box-active']}`);

      expect(component.find(`.${styles['favorite-picker']}`)).to.be.present();
      expect(component.find(`.${styles['color-box']}`)).to.be.present();
      expect(activeBox).to.be.present();
      expect(activeBox.prop('title')).to.equal(hex);
      expect(activeBox).to.have.lengthOf(1);
    });
  });
});

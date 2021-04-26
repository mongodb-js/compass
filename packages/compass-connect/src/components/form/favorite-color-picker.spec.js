import { shallow } from 'enzyme';
import React from 'react';

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

    it('selects no color', () => {
      const activeBox = component.find(`.${styles['color-box-active']}`);

      expect(component.find(`.${styles['favorite-picker']}`)).to.be.present();
      expect(component.find(`.${styles['color-box']}`)).to.be.present();
      expect(activeBox).to.be.present();
      expect(activeBox.prop('title')).to.equal('No color');
      expect(activeBox).to.have.lengthOf(1);
    });

    it('does not draw a checkmark for non color option', () => {
      expect(component.find('div[key="noColor"] g')).to.be.not.present();
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

    it('selects a custom color', () => {
      const activeBox = component.find(`.${styles['color-box-active']}`);

      expect(component.find(`.${styles['favorite-picker']}`)).to.be.present();
      expect(component.find(`.${styles['color-box']}`)).to.be.present();
      expect(activeBox).to.be.present();
      expect(activeBox.prop('title')).to.equal(hex);
      expect(activeBox).to.have.lengthOf(1);
    });

    it('draws a checkmark for a selected color', () => {
      const checkmark = component.find(`.${styles['color-box-active']} g`);

      expect(checkmark.prop('fillOpacity')).to.equal(1);
      expect(checkmark.prop('strokeOpacity')).to.equal(1);
    });

    it('does not draw a checkmark for a non selected color', () => {
      expect(component.find(`.${styles['color-box']} g`)).to.have.lengthOf(10);
      expect(component.find('g[fillOpacity=1]')).to.have.lengthOf(1);
      expect(component.find('g[fillOpacity=0]')).to.have.lengthOf(9);
    });
  });
});

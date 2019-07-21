import React from 'react';
import { mount } from 'enzyme';

import NonGenuineWarningPill from 'components/non-genuine-warning-pill';
import styles from './non-genuine-warning-pill.less';

describe('NonGenuineWarningPill [Component]', () => {
  let component;

  context('when the instance is a non genuine mongo', () => {
    beforeEach(() => {
      component = mount(<NonGenuineWarningPill isGenuineMongoDB={false} />);
    });

    afterEach(() => {
      component = null;
    });

    it('renders the pill', () => {
      expect(component.find(`.${styles['non-genuine-warning-pill']}`)).to.be.present();
    });

    it('renders the icon', () => {
      expect(component.find('span')).to.be.present();
    });
  });

  context('when the instance is a genuine mongo', () => {
    beforeEach(() => {
      component = mount(<NonGenuineWarningPill isGenuineMongoDB />);
    });

    afterEach(() => {
      component = null;
    });

    it('does not render the pill', () => {
      expect(component.find(`.${styles['non-genuine-warning-pill']}`)).to.not.be.present();
    });
  });
});

import React from 'react';
import { expect } from 'chai';
import { mount } from 'enzyme';

import NonGenuineWarningPill from '../non-genuine-warning-pill';
import styles from './non-genuine-warning-pill.module.less';

describe('NonGenuineWarningPill [Component]', () => {
  let component;

  context('when the instance is a non genuine mongo', () => {
    beforeEach(() => {
      component = mount(<NonGenuineWarningPill isGenuineMongoDB={false} isSidebarCollapsed={false} />);
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
      component = mount(<NonGenuineWarningPill isGenuineMongoDB isSidebarCollapsed={false} />);
    });

    afterEach(() => {
      component = null;
    });

    it('does not render the pill', () => {
      expect(component.find(`.${styles['non-genuine-warning-pill']}`)).to.not.be.present();
    });
  });

  context('when the instance is collapsed', () => {
    beforeEach(() => {
      component = mount(<NonGenuineWarningPill isGenuineMongoDB isSidebarCollapsed />);
    });

    afterEach(() => {
      component = null;
    });

    it('does not render the pill', () => {
      expect(component.find(`.${styles['non-genuine-warning-pill']}`)).to.not.be.present();
    });
  });
});

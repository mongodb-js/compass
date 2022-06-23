import React from 'react';
import { expect } from 'chai';
import { mount } from 'enzyme';

import NonGenuineWarningPill from '../non-genuine-warning-pill';
import styles from './non-genuine-warning-pill.module.less';

describe('NonGenuineWarningPill [Component]', function () {
  let component;

  context('when the instance is a non genuine mongo', function () {
    beforeEach(function () {
      component = mount(<NonGenuineWarningPill isGenuineMongoDB={false} isSidebarCollapsed={false} />);
    });

    afterEach(function () {
      component = null;
    });

    it('renders the pill', function () {
      expect(component.find(`.${styles['non-genuine-warning-pill']}`)).to.be.present();
    });

    it('renders the icon', function () {
      expect(component.find('span')).to.be.present();
    });
  });

  context('when the instance is a genuine mongo', function () {
    beforeEach(function () {
      component = mount(<NonGenuineWarningPill isGenuineMongoDB isSidebarCollapsed={false} />);
    });

    afterEach(function () {
      component = null;
    });

    it('does not render the pill', function () {
      expect(component.find(`.${styles['non-genuine-warning-pill']}`)).to.not.be.present();
    });
  });

  context('when the instance is collapsed', function () {
    beforeEach(function () {
      component = mount(<NonGenuineWarningPill isGenuineMongoDB isSidebarCollapsed />);
    });

    afterEach(function () {
      component = null;
    });

    it('does not render the pill', function () {
      expect(component.find(`.${styles['non-genuine-warning-pill']}`)).to.not.be.present();
    });
  });
});

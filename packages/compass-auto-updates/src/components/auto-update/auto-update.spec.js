import React from 'react';
import { mount } from 'enzyme';

import AutoUpdate from '../auto-update';
import styles from './auto-update.module.less';

describe('AutoUpdate [Component]', () => {
  context('when the state is visible', () => {
    let component;
    let cancelUpdateSpy;
    let visitReleaseNotesSpy;

    beforeEach(() => {
      cancelUpdateSpy = sinon.spy();
      visitReleaseNotesSpy = sinon.spy();
      component = mount(
        <AutoUpdate
          version="1.12.0"
          isVisible
          cancelUpdate={cancelUpdateSpy}
          visitReleaseNotes={visitReleaseNotesSpy} />
      );
    });

    afterEach(() => {
      cancelUpdateSpy = null;
      visitReleaseNotesSpy = null;
      component = null;
    });

    it('renders the correct root classname', () => {
      expect(component.find(`.${styles['auto-update']}`)).to.be.present();
    });

    it('renders the banner as visible', () => {
      expect(component.find(`.${styles['auto-update-is-visible']}`)).to.be.present();
    });

    it('renders the text', () => {
      expect(component.find(`.${styles['auto-update-text-available']}`)).to.have.
        text('Compass version 1.12.0 is now available! Would you like to install and restart Compass?');
    });
  });

  context('when the state is not visible', () => {

  });
});

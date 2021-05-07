import React from 'react';
import { mount } from 'enzyme';

import Input from 'components/input';
import InputToolbar from 'components/input-toolbar';
import styles from './input.less';

import workspaceStyles from '../input-workspace/input-workspace.less';

describe('Input [Component]', () => {
  let component;
  let toggleSpy;
  let refreshSpy;

  describe('default', () => {
    before(() => {
      toggleSpy = sinon.spy();
      refreshSpy = sinon.spy();

      component = mount(
        <Input
          refreshInputDocuments={refreshSpy}
          toggleInputDocumentsCollapsed={toggleSpy}
          documents={[]}
          isExpanded
          isLoading
          openLink={sinon.spy()}
          count={0} />
      );
    });

    after(() => {
      component = null;
    });

    it('renders the wrapper div', () => {
      expect(component.find(`.${styles.input}`)).to.be.present();
    });

    it('renders the toolbar', () => {
      expect(component.find(`.${styles.input}`)).to.have.descendants(InputToolbar);
    });

    it('renders the workspace', () => {
      expect(component.find(`.${workspaceStyles['input-workspace']}`)).to.be.present();
    });
  });

  describe('when collapsed', () => {
    before(() => {
      component = mount(
        <Input
          refreshInputDocuments={refreshSpy}
          toggleInputDocumentsCollapsed={toggleSpy}
          documents={[]}
          isExpanded={false}
          isLoading
          openLink={sinon.spy()}
          count={0} />
      );
    });

    it('renders the toolbar', () => {
      expect(component.find(`.${styles.input}`)).to.have.descendants(InputToolbar);
    });

    it('must not render the workspace', () => {
      expect(component.find(`.${workspaceStyles['input-workspace']}`)).to.not.be.present();
    });

    after(() => {
      component = null;
    });
  });
});

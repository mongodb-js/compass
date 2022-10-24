import React from 'react';
import { mount } from 'enzyme';
import sinon from 'sinon';
import { expect } from 'chai';

import { Input } from './input';
import InputToolbar from '../input-toolbar';
import styles from './input.module.less';

import workspaceStyles from '../input-workspace/input-workspace.module.less';

describe('Input [Component]', function() {
  let component;
  let toggleSpy;
  let refreshSpy;

  describe('default', function() {
    before(function() {
      toggleSpy = sinon.spy();
      refreshSpy = sinon.spy();

      component = mount(
        <Input
          refreshInputDocuments={refreshSpy}
          toggleInputDocumentsCollapsed={toggleSpy}
          documents={[]}
          isExpanded
          isLoading
          count={0} />
      );
    });

    after(function() {
      component = null;
    });

    it('renders the wrapper div', function() {
      expect(component.find(`.${styles.input}`)).to.be.present();
    });

    it('renders the toolbar', function() {
      expect(component.find(`.${styles.input}`)).to.have.descendants(InputToolbar);
    });

    it('renders the workspace', function() {
      expect(component.find(`.${workspaceStyles['input-workspace']}`)).to.be.present();
    });
  });

  describe('when collapsed', function() {
    before(function() {
      component = mount(
        <Input
          refreshInputDocuments={refreshSpy}
          toggleInputDocumentsCollapsed={toggleSpy}
          documents={[]}
          isExpanded={false}
          isLoading
          count={0} />
      );
    });

    it('renders the toolbar', function() {
      expect(component.find(`.${styles.input}`)).to.have.descendants(InputToolbar);
    });

    it('must not render the workspace', function() {
      expect(component.find(`.${workspaceStyles['input-workspace']}`)).to.not.be.present();
    });

    after(function() {
      component = null;
    });
  });
});

import React from 'react';
import { mount } from 'enzyme';

import Editor from 'components/editor';
import AceEditor from 'react-ace';

import styles from './editor.less';

describe('Editor [Component]', () => {
  context('when the component is rendered as input', () => {
    let component;

    const query = '{ category_code: "smooth jazz", release_year: 2009 }';

    beforeEach(() => {
      component = mount(
        <Editor
          outputQuery=""
          inputQuery={query}
          outputLang="python"
          queryError={null}
          imports=""
          input/>
      );
    });

    afterEach(() => {
      component = null;
    });

    it('renders the headers div', () => {
      expect(component.find(`.${styles.editor}`)).to.be.present();
    });

    it('renders headers input text', () => {
      expect(component.find(`.${styles.editor}`)).to.have.descendants(AceEditor);
    });

    it('renders the editor with correct input', () => {
      expect(component.find(AceEditor)).prop('value').to.be.equal(query);
    });
  });

  context('when the component is rendered with query error and input', () => {
    let component;

    const query = '{ category_code: "smooth jazz", release_year: 2009 }';

    beforeEach(() => {
      component = mount(
        <Editor
          outputQuery="output"
          inputQuery={query}
          outputLang="python"
          queryError="error"
          imports=""
          input/>
      );
    });

    afterEach(() => {
      component = null;
    });

    it('renders the editor with correct input', () => {
      expect(component.find(AceEditor)).prop('value').to.be.equal(query);
    });
  });

  context('when the component is rendered with query error and output', () => {
    let component;

    const query = '{ category_code: "smooth jazz", release_year: 2009 }';

    beforeEach(() => {
      component = mount(
        <Editor
          outputQuery="output"
          inputQuery={query}
          outputLang="python"
          queryError="error"
          imports=""/>
      );
    });

    afterEach(() => {
      component = null;
    });

    it('editor has no output', () => {
      expect(component.find(AceEditor)).prop('value').to.be.equal('');
    });
  });

  context('when the component is rendered as output', () => {
    let component;

    const outputQuery = "{ 'category_code': 'smooth jazz', 'release_year': 2009 }";

    beforeEach(() => {
      component = mount(
        <Editor
          outputQuery={outputQuery}
          inputQuery=""
          outputLang="python"
          queryError=""
          imports=""/>
      );
    });

    afterEach(() => {
      component = null;
    });

    it('editor has the value of python output', () => {
      expect(component.find(AceEditor)).prop('value').to.be.equal(outputQuery);
    });
  });

  context('when the component is rendered with imports', () => {
    let component;

    const imports = 'import datetime';

    beforeEach(() => {
      component = mount(
        <Editor
          outputQuery=""
          inputQuery=""
          outputLang="python"
          queryError=""
          imports={imports}
          showImports/>
      );
    });

    afterEach(() => {
      component = null;
    });

    it('ace editor has the value of python imports', () => {
      expect(component.find(AceEditor)).prop('value').to.be.equal(`${imports}\n`);
    });
  });
});

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
          outputLang="python"
          transpiledExpression="transpiledExpression"
          error={null}
          imports="imports"
          showImports={false}
          from={query}
          isInput/>
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

  context('when the component is rendered as input', () => {
    context('without error', () => {
      let component;

      const query = '{ category_code: "smooth jazz", release_year: 2009 }';

      beforeEach(() => {
        component = mount(
          <Editor
            transpiledExpression="transpiledExpression"
            from={query}
            outputLang="python"
            error={null}
            imports="imports"
            showImports={false}
            isInput
          />
        );
      });

      afterEach(() => {
        component = null;
      });

      it('renders the editor with correct input', () => {
        expect(component.find(AceEditor)).prop('value').to.be.equal(query);
      });
    });

    context('with error', () => {
      let component;

      const query = '{ category_code: "smooth jazz", release_year: 2009 }';

      beforeEach(() => {
        component = mount(
          <Editor
            transpiledExpression="transpiledExpression"
            from={query}
            outputLang="python"
            error="error"
            imports="imports"
            showImports={false}
            isInput
          />
        );
      });

      afterEach(() => {
        component = null;
      });

      it('renders the editor with correct input', () => {
        expect(component.find(AceEditor)).prop('value').to.be.equal(query);
      });
    });
  });

  context('when the component is rendered as output', () => {
    context('without error', () => {
      let component;

      const outputQuery = "{ 'category_code': 'smooth jazz', 'release_year': 2009 }";

      beforeEach(() => {
        component = mount(
          <Editor
            transpiledExpression={outputQuery}
            from="from"
            outputLang="python"
            error="error"
            showImports={false}
            imports="imports"/>
        );
      });

      afterEach(() => {
        component = null;
      });

      it('editor has the value of python output', () => {
        expect(component.find(AceEditor)).prop('value').to.be.equal('');
      });
    });
    context('without imports', () => {
      let component;

      const outputQuery = "{ 'category_code': 'smooth jazz', 'release_year': 2009 }";

      beforeEach(() => {
        component = mount(
          <Editor
            transpiledExpression={outputQuery}
            from="from"
            outputLang="python"
            error=""
            showImports={false}
            imports="imports"/>
        );
      });

      afterEach(() => {
        component = null;
      });

      it('editor has the value of python output', () => {
        expect(component.find(AceEditor)).prop('value').to.be.equal(outputQuery);
      });
    });

    context('with imports', () => {
      let component;

      const imports = 'import datetime';
      const transpiledExpression = '{}';

      beforeEach(() => {
        component = mount(
          <Editor
            from="from"
            transpiledExpression={transpiledExpression}
            outputLang="python"
            error=""
            imports={imports}
            showImports/>
        );
      });

      afterEach(() => {
        component = null;
      });

      it('ace editor has the value of python imports', () => {
        expect(component.find(AceEditor)).prop('value').to.be.equal(`${imports}\n\n${transpiledExpression}`);
      });
    });
  });
});

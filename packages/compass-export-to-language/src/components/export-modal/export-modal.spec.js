import React from 'react';
import { shallow } from 'enzyme';

import ExportModal from 'components/export-modal';
import ExportForm from 'components/export-form';

import styles from './export-modal.less';

describe('ExportModal [Component]', () => {
  context('when the component is rendered', () => {
    let component;
    const exportQuery = {
      outputLang: 'python',
      namespace: 'Query',
      copySuccess: false,
      queryError: null,
      modalOpen: false,
      returnQuery: '',
      inputQuery: '',
      imports: ''
    };
    const includeImportsSpy = sinon.spy();
    const setOutputLangSpy = sinon.spy();
    const togleModalSpy = sinon.spy();
    const clearCopySpy = sinon.spy();
    const copyQuerySpy = sinon.spy();
    const runQuerySpy = sinon.spy();

    // need to use shallow render for testing a modal, since a modal is a
    // portal component and gets attached to the DOM rather than being a child
    // to react component (this means we can't every .find anything in
    // component tests)
    // for more info: https://stackoverflow.com/a/45644364
    beforeEach(() => {
      component = shallow(
        <ExportModal
          includeImports={includeImportsSpy}
          setOutputLang={setOutputLangSpy}
          togleModal={togleModalSpy}
          exportQuery={exportQuery}
          clearCopy={clearCopySpy}
          copyQuery={copyQuerySpy}
          runQuery={runQuerySpy} />
      );
    });

    afterEach(() => {
      component = null;
    });

    it('renders the title text', () => {
      expect(component.find('[data-test-id="export-to-lang-modal-title"]')).to.contain.html('Export Query To Language');
    });

    it('renders the root modal', () => {
      expect(component.find('[data-test-id="export-to-lang-modal"]')).to.be.present();
    });

    it('renders export form', () => {
      expect(component.find('[data-test-id="export-to-lang-modal-body"]')).to.have.descendants(ExportForm);
    });

    it('renders the close modal button', () => {
      expect(component.find('[data-test-id="export-to-lang-close"]')).to.be.present();
    });

    it('renders the import checkbox', () => {
      expect(component.find(`.${styles['export-to-lang-modal-checkbox']}`)).to.be.present();
    });
  });

  // context('when clicking on close button', () => {
  //   let component;
  //   const exportQuery = {
  //     outputLang: 'python',
  //     namespace: 'Query',
  //     copySuccess: false,
  //     queryError: null,
  //     modalOpen: true,
  //     returnQuery: '',
  //     inputQuery: '',
  //     imports: ''
  //   };
  //   const includeImportsSpy = sinon.spy();
  //   const setOutputLangSpy = sinon.spy();
  //   const togleModalSpy = sinon.spy();
  //   const clearCopySpy = sinon.spy();
  //   const copyQuerySpy = sinon.spy();
  //   const runQuerySpy = sinon.spy();

  //   beforeEach(() => {
  //     component = shallow(
  //       <ExportModal
  //         includeImports={includeImportsSpy}
  //         setOutputLang={setOutputLangSpy}
  //         togleModal={togleModalSpy}
  //         exportQuery={exportQuery}
  //         clearCopy={clearCopySpy}
  //         copyQuery={copyQuerySpy}
  //         runQuery={runQuerySpy} />
  //     );
  //   });

  //   afterEach(() => {
  //     component = null;
  //   });

  //   it('calls the click button action', () => {
  //     component.find('[data-test-id="export-to-lang-close"]').simulate('click');
  //     expect(togleModalSpy.calledWith(false)).to.equal(true);
  //   });
  // });

  context('when clicking on import checkbox', () => {
    let component;
    const exportQuery = {
      outputLang: 'python',
      namespace: 'Query',
      copySuccess: false,
      queryError: null,
      modalOpen: true,
      returnQuery: '',
      inputQuery: '',
      imports: ''
    };
    const includeImportsSpy = sinon.spy();
    const setOutputLangSpy = sinon.spy();
    const togleModalSpy = sinon.spy();
    const clearCopySpy = sinon.spy();
    const copyQuerySpy = sinon.spy();
    const runQuerySpy = sinon.spy();

    beforeEach(() => {
      component = shallow(
        <ExportModal
          includeImports={includeImportsSpy}
          setOutputLang={setOutputLangSpy}
          togleModal={togleModalSpy}
          exportQuery={exportQuery}
          clearCopy={clearCopySpy}
          copyQuery={copyQuerySpy}
          runQuery={runQuerySpy} />
      );
    });

    afterEach(() => {
      component = null;
    });

    it('calls the click button action', () => {
      component.find('[data-test-id="export-to-lang-checkbox"]').simulate('click');
      expect(includeImportsSpy.calledOnce).to.equal(true);
    });
  });
});

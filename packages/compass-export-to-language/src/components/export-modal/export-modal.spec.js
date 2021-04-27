import React from 'react';
import { shallow } from 'enzyme';

import ExportModal from 'components/export-modal';
import ExportForm from 'components/export-form';

describe('ExportModal [Component]', () => {
  context('when the component is rendered', () => {
    let component;
    const showImportsChangedSpy = sinon.spy();
    const buildersChangedSpy = sinon.spy();
    const driverChangedSpy = sinon.spy();
    const outputLangChangedSpy = sinon.spy();
    const modalOpenChangedSpy = sinon.spy();
    const copySuccessChangedSpy = sinon.spy();
    const runTranspilerSpy = sinon.spy();
    const copyToClipboardSpy = sinon.spy();

    // need to use shallow render for testing a modal, since a modal is a
    // portal component and gets attached to the DOM rather than being a child
    // to react component (this means we can't every .find anything in
    // component tests)
    // for more info: https://stackoverflow.com/a/45644364
    beforeEach(() => {
      component = shallow(
        <ExportModal
          copySuccess={false}
          copyToClipboard={copyToClipboardSpy}
          builders={false}
          driver={false}
          imports="imports"
          showImports={false}
          inputExpression={{filter: 'input expression'}}
          transpiledExpression="transpiled expression"
          modalOpen={false}
          mode="Query"
          outputLang="python"
          error={null}
          uri="uri"
          showImportsChanged={showImportsChangedSpy}
          buildersChanged={buildersChangedSpy}
          driverChanged={driverChangedSpy}
          outputLangChanged={outputLangChangedSpy}
          modalOpenChanged={modalOpenChangedSpy}
          copySuccessChanged={copySuccessChangedSpy}
          runTranspiler={runTranspilerSpy} />
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
      expect(component.find('[data-test-id="export-to-lang-checkbox-imports"]')).to.be.present();
    });
    it('renders the driver checkbox', () => {
      expect(component.find('[data-test-id="export-to-lang-checkbox-driver"]')).to.be.present();
    });
    it('does not render the builders checkbox on default', () => {
      expect(component.find('[data-test-id="export-to-lang-checkbox-builders"]')).to.not.be.present();
    });
  });

  context('when clicking on import checkbox', () => {
    let component;
    const showImportsChangedSpy = sinon.spy();
    const buildersChangedSpy = sinon.spy();
    const driverChangedSpy = sinon.spy();
    const outputLangChangedSpy = sinon.spy();
    const modalOpenChangedSpy = sinon.spy();
    const copySuccessChangedSpy = sinon.spy();
    const copyToClipboardSpy = sinon.spy();
    const runTranspilerSpy = sinon.spy();

    beforeEach(() => {
      component = shallow(
        <ExportModal
          copySuccess={false}
          builders={false}
          driver={false}
          imports="imports"
          showImports={false}
          inputExpression={{filter: 'input expression'}}
          transpiledExpression="transpiled expression"
          modalOpen={false}
          mode="Query"
          outputLang="python"
          error={null}
          uri="uri"
          showImportsChanged={showImportsChangedSpy}
          buildersChanged={buildersChangedSpy}
          driverChanged={driverChangedSpy}
          outputLangChanged={outputLangChangedSpy}
          modalOpenChanged={modalOpenChangedSpy}
          copySuccessChanged={copySuccessChangedSpy}
          copyToClipboard={copyToClipboardSpy}
          runTranspiler={runTranspilerSpy} />
      );
    });

    afterEach(() => {
      component = null;
    });

    it('calls the click button action', () => {
      component.find('[data-test-id="export-to-lang-checkbox-imports"]').simulate('click');
      expect(showImportsChangedSpy.calledOnce).to.equal(true);
    });
  });

  context('when clicking on builders checkbox', () => {
    let component;
    const showImportsChangedSpy = sinon.spy();
    const buildersChangedSpy = sinon.spy();
    const driverChangedSpy = sinon.spy();
    const outputLangChangedSpy = sinon.spy();
    const modalOpenChangedSpy = sinon.spy();
    const copySuccessChangedSpy = sinon.spy();
    const copyToClipboardSpy = sinon.spy();
    const runTranspilerSpy = sinon.spy();

    beforeEach(() => {
      component = shallow(
        <ExportModal
          copySuccess={false}
          builders={false}
          driver={false}
          imports="imports"
          showImports={false}
          inputExpression={{filter: 'input expression'}}
          transpiledExpression="transpiled expression"
          modalOpen={false}
          mode="Query"
          outputLang="java"
          error={null}
          uri="uri"
          showImportsChanged={showImportsChangedSpy}
          buildersChanged={buildersChangedSpy}
          driverChanged={driverChangedSpy}
          outputLangChanged={outputLangChangedSpy}
          modalOpenChanged={modalOpenChangedSpy}
          copySuccessChanged={copySuccessChangedSpy}
          copyToClipboard={copyToClipboardSpy}
          runTranspiler={runTranspilerSpy} />
      );
    });

    afterEach(() => {
      component = null;
    });

    it('renders the builders checkbox when output is Java and in Query mode', () => {
      expect(component.find('[data-test-id="export-to-lang-checkbox-builders"]')).to.be.present();
    });
    it('calls the click button action', () => {
      component.find('[data-test-id="export-to-lang-checkbox-builders"]').simulate('click');
      expect(buildersChangedSpy.calledOnce).to.equal(true);
    });
    it('hides the builders checkbox when output is Java and in Pipeline mode', () => {
      component.setProps({
        mode: 'Pipeline'
      });
      expect(component.find('[data-test-id="export-to-lang-checkbox-builders"]')).not.to.be.present();
    });
  });

  context('when clicking on driver checkbox', () => {
    let component;
    const showImportsChangedSpy = sinon.spy();
    const buildersChangedSpy = sinon.spy();
    const driverChangedSpy = sinon.spy();
    const outputLangChangedSpy = sinon.spy();
    const modalOpenChangedSpy = sinon.spy();
    const copySuccessChangedSpy = sinon.spy();
    const copyToClipboardSpy = sinon.spy();
    const runTranspilerSpy = sinon.spy();

    beforeEach(() => {
      component = shallow(
        <ExportModal
          copySuccess={false}
          builders={false}
          driver={false}
          imports="imports"
          showImports={false}
          inputExpression={{filter: 'input expression'}}
          transpiledExpression="transpiled expression"
          modalOpen={false}
          mode="Query"
          outputLang="java"
          error={null}
          uri="uri"
          showImportsChanged={showImportsChangedSpy}
          buildersChanged={buildersChangedSpy}
          driverChanged={driverChangedSpy}
          outputLangChanged={outputLangChangedSpy}
          modalOpenChanged={modalOpenChangedSpy}
          copySuccessChanged={copySuccessChangedSpy}
          copyToClipboard={copyToClipboardSpy}
          runTranspiler={runTranspilerSpy} />
      );
    });

    afterEach(() => {
      component = null;
    });

    it('renders the driver checkbox when true', () => {
      expect(component.find('[data-test-id="export-to-lang-checkbox-driver"]')).to.be.present();
    });
    it('calls the click button action', () => {
      component.find('[data-test-id="export-to-lang-checkbox-driver"]').simulate('click');
      expect(driverChangedSpy.calledOnce).to.equal(true);
    });
  });
});

import React from 'react';
import { mount } from 'enzyme';
import { expect } from 'chai';
import sinon from 'sinon';

import ExportForm from '../export-form';
import SelectLang from '../select-lang';
import { Alert } from 'react-bootstrap';
import Editor from '../editor';

import styles from './export-form.module.less';

describe('ExportForm [Component]', function () {
  context('when the component is rendered', function () {
    let component;
    const outputLangChangedSpy = sinon.spy();
    const copySuccessChangedSpy = sinon.spy();
    const copyToClipboardSpy = sinon.spy();
    const runTranspilerSpy = sinon.spy();

    beforeEach(function () {
      component = mount(
        <ExportForm
          copySuccess={false}
          copyToClipboard={copyToClipboardSpy}
          imports=""
          showImports={false}
          inputExpression={{filter: '{x: 1}'}}
          transpiledExpression="{\n\'x\': 1\n}"
          mode="Query"
          outputLang="python"
          error={null}
          from="{x: 1}"
          outputLangChanged={outputLangChangedSpy}
          copySuccessChanged={copySuccessChangedSpy}
          runTranspiler={runTranspilerSpy} />
      );
    });

    afterEach(function () {
      component = null;
    });

    it('renders parent div', function () {
      expect(component.find('[data-testid="export-to-lang"]')).to.be.present();
    });

    it('renders the headers div', function () {
      expect(component.find(`.${styles['export-to-lang-headers']}`)).to.be.present();
    });

    it('renders headers input text', function () {
      expect(
        component.find(`.${styles['export-to-lang-headers-input']}`)
      ).to.contain.html('My Query:');
    });

    it('renders headers output text', function () {
      expect(
        component.find(`.${styles['export-to-lang-headers-output-title']}`)
      ).to.contain.html('Export Query To:');
    });

    it('renders select lang dropdown', function () {
      expect(
        component.find(`.${styles['export-to-lang-headers-output']}`)
      ).to.have.descendants(SelectLang);
    });

    it('renders query input/output editor wrapper', function () {
      expect(
        component.find(`.${styles['export-to-lang-query']}`)
      ).to.be.present();
    });

    it('renders input editor wrapper', function () {
      expect(
        component.find(`.${styles['export-to-lang-query-input']}`)
      ).to.be.present();
    });

    it('does not render an error div', function () {
      expect(
        component.find(`.${styles['export-to-lang-query-input']}`)
      ).to.not.have.descendants(Alert);
    });

    it('renders input editor', function () {
      expect(
        component.find(`.${styles['export-to-lang-query-input']}`)
      ).to.have.descendants(Editor);
    });

    it('renders output editor wrapper', function () {
      expect(
        component.find(`.${styles['export-to-lang-query-output']}`)
      ).to.be.present();
    });

    it('renders output editor', function () {
      expect(
        component.find(`.${styles['export-to-lang-query-output']}`)
      ).to.have.descendants(Editor);
    });

    it('renders copy button', function () {
      expect(
        component.find(`.${styles['export-to-lang-query-output-copy']}`)
      ).to.be.present();
    });
  });

  context('when clicking on copy button', function () {
    let component;
    const outputLangChangedSpy = sinon.spy();
    const copySuccessChangedSpy = sinon.spy();
    const copyToClipboardSpy = sinon.spy();
    const runTranspilerSpy = sinon.spy();

    beforeEach(function () {
      component = mount(
        <ExportForm
          copySuccess={false}
          copyToClipboard={copyToClipboardSpy}
          imports=""
          showImports={false}
          inputExpression={{filter: '{x: 1}'}}
          transpiledExpression="{\n'x': 1\n}"
          mode="Query"
          outputLang="python"
          error={null}
          from="{x: 1}"
          outputLangChanged={outputLangChangedSpy}
          copySuccessChanged={copySuccessChangedSpy}
          runTranspiler={runTranspilerSpy} />
      );
    });

    afterEach(function () {
      component = null;
    });

    it('calls the copy action with the output', function () {
      component
        .find(`.${styles['export-to-lang-query-output-copy']}`)
        .find('.fa-copy')
        .simulate('click');
      expect(copyToClipboardSpy.calledOnce).to.equal(true);
      expect(copyToClipboardSpy.getCall(0).args[0]).to.deep.equal(
        "{\\n'x': 1\\n}"
      );
      expect(copySuccessChangedSpy.calledOnce).to.equal(true);
    });

    it('calls the copy action with the input', function () {
      component
        .find(`.${styles['export-to-lang-query-input-copy']}`)
        .find('.fa-copy')
        .simulate('click');
      expect(copyToClipboardSpy.calledTwice).to.equal(true);
      expect(copyToClipboardSpy.getCall(1).args[0]).to.deep.equal(
        '{x: 1}'
      );
      expect(copySuccessChangedSpy.calledTwice).to.equal(true);
    });
  });

  context('when export query state contains an error', function () {
    let component;
    const error = 'error error error';
    const outputLangChangedSpy = sinon.spy();
    const copySuccessChangedSpy = sinon.spy();
    const copyToClipboardSpy = sinon.spy();
    const runTranspilerSpy = sinon.spy();

    beforeEach(function () {
      component = mount(
        <ExportForm
          copySuccess={false}
          copyToClipboard={copyToClipboardSpy}
          imports=""
          showImports={false}
          inputExpression={{filter: '{x: 1}'}}
          transpiledExpression="{\n\'x\': 1\n}"
          mode="Query"
          outputLang="python"
          error={error}
          from="{x: 1}"
          outputLangChanged={outputLangChangedSpy}
          copySuccessChanged={copySuccessChangedSpy}
          runTranspiler={runTranspilerSpy} />
      );
    });

    afterEach(function () {
      component = null;
    });

    it('returns an alert div', function () {
      expect(component).to.have.descendants(Alert);
    });

    it('alert div has the value of error state', function () {
      expect(component.find(Alert)).prop('children').to.be.equal(error);
    });
  });
});

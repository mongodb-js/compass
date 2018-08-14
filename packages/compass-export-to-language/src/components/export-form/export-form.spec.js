import React from 'react';
import { mount } from 'enzyme';

import ExportForm from 'components/export-form';
import SelectLang from 'components/select-lang';
import { Alert } from 'react-bootstrap';
import Editor from 'components/editor';

import styles from './export-form.less';

describe('ExportForm [Component]', () => {
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
    const setOutputLangSpy = sinon.spy();
    const clearCopySpy = sinon.spy();
    const copyQuerySpy = sinon.spy();
    const runQuerySpy = sinon.spy();

    beforeEach(() => {
      component = mount(
        <ExportForm
          setOutputLang={setOutputLangSpy}
          exportQuery={exportQuery}
          clearCopy={clearCopySpy}
          copyQuery={copyQuerySpy}
          runQuery={runQuerySpy} />
      );
    });

    afterEach(() => {
      component = null;
    });

    it('renders parent div', () => {
      expect(component.find('[data-test-id="export-to-lang"]')).to.be.present();
    });

    it('renders the headers div', () => {
      expect(component.find(`.${styles['export-to-lang-headers']}`)).to.be.present();
    });

    it('renders headers input text', () => {
      expect(component.find(`.${styles['export-to-lang-headers-input']}`)).to.contain.html('My Query:');
    });

    it('renders headers output text', () => {
      expect(component.find(`.${styles['export-to-lang-headers-output-title']}`)).to.contain.html('Export Query To:');
    });

    it('renders select lang dropdown', () => {
      expect(component.find(`.${styles['export-to-lang-headers-output']}`)).to.have.descendants(SelectLang);
    });

    it('renders query input/output editor wrapper', () => {
      expect(component.find(`.${styles['export-to-lang-query']}`)).to.be.present();
    });

    it('renders input editor wrapper', () => {
      expect(component.find(`.${styles['export-to-lang-query-input']}`)).to.be.present();
    });

    it('does not render an error div', () => {
      expect(component.find(`.${styles['export-to-lang-query-input']}`)).to.not.have.descendants(Alert);
    });

    it('renders input editor', () => {
      expect(component.find(`.${styles['export-to-lang-query-input']}`)).to.have.descendants(Editor);
    });

    it('renders output editor wrapper', () => {
      expect(component.find(`.${styles['export-to-lang-query-output']}`)).to.be.present();
    });

    it('renders output editor', () => {
      expect(component.find(`.${styles['export-to-lang-query-output']}`)).to.have.descendants(Editor);
    });

    it('renders copy button', () => {
      expect(component.find(`.${styles['export-to-lang-query-output-copy']}`)).to.be.present();
    });
  });

  context('when clicking on copy button', () => {
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
    const setOutputLangSpy = sinon.spy();
    const clearCopySpy = sinon.spy();
    const copyQuerySpy = sinon.spy();
    const runQuerySpy = sinon.spy();

    beforeEach(() => {
      component = mount(
        <ExportForm
          setOutputLang={setOutputLangSpy}
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
      component.find('.fa-copy').simulate('click');
      expect(copyQuerySpy.calledOnce).to.equal(true);
    });
  });

  context('when export query state contains an error', () => {
    let component;
    const error = 'error error error';
    const exportQuery = {
      outputLang: 'python',
      namespace: 'Query',
      copySuccess: false,
      queryError: error,
      modalOpen: true,
      returnQuery: '',
      inputQuery: '',
      imports: ''
    };
    const setOutputLangSpy = sinon.spy();
    const clearCopySpy = sinon.spy();
    const copyQuerySpy = sinon.spy();
    const runQuerySpy = sinon.spy();

    beforeEach(() => {
      component = mount(
        <ExportForm
          setOutputLang={setOutputLangSpy}
          exportQuery={exportQuery}
          clearCopy={clearCopySpy}
          copyQuery={copyQuerySpy}
          runQuery={runQuerySpy} />
      );
    });

    afterEach(() => {
      component = null;
    });

    it('returns an alert div', () => {
      expect(component.find(`.${styles['export-to-lang-query-input']}`)).to.have.descendants(Alert);
    });

    it('alert div has the value of error state', () => {
      expect(component.find(Alert)).prop('children').to.be.equal(error);
    });
  });
});

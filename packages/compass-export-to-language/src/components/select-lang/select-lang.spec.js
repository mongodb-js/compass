import React from 'react';
import { mount, shallow } from 'enzyme';

import SelectLang from 'components/select-lang';
import Select from 'react-select-plus';

import styles from './select-lang.less';

describe('SelectLang [Component]', () => {
  context('when the component is rendered', () => {
    let component;

    const query = { category_code: 'smooth jazz', release_year: 2009 };
    const setOutputLangSpy = sinon.spy();
    const runQuerySpy = sinon.spy();
    const outputLang = 'python';

    const langOutputOptions = [
      { value: 'java', label: 'Java' },
      { value: 'javascript', label: 'Node' },
      { value: 'csharp', label: 'C#' },
      { value: 'python', label: 'Python 3' }
    ];

    beforeEach(() => {
      component = mount(
        <SelectLang
          setOutputLang={setOutputLangSpy}
          outputLang={outputLang}
          runQuery={runQuerySpy}
          inputQuery={query}/>
      );
    });

    afterEach(() => {
      component = null;
    });

    it('renders the headers div', () => {
      expect(component.find(`.${styles['select-lang']}`)).to.be.present();
    });

    it('renders headers input text', () => {
      expect(component.find(Select)).prop('options').to.deep.equal(langOutputOptions);
    });

    it('value of the select box is python', () => {
      expect(component.find(Select).props().value).to.equal('python');
    });
  });

  context('when clicking on copy button', () => {
    let component;

    const query = { category_code: 'smooth jazz', release_year: 2009 };
    const setOutputLangSpy = sinon.spy();
    const runQuerySpy = sinon.spy();
    const outputLang = 'python';

    beforeEach(() => {
      component = shallow(
        <SelectLang
          setOutputLang={setOutputLangSpy}
          outputLang={outputLang}
          runQuery={runQuerySpy}
          inputQuery={query}/>
      );
    });

    afterEach(() => {
      component = null;
    });

    it('calls the run query method', () => {
      component.find(Select).simulate('change', { target: { value: 'java' } });
      expect(runQuerySpy.calledOnce).to.equal(true);
    });

    it('calls the set output lang method', () => {
      component.simulate('click');
      expect(setOutputLangSpy.calledOnce).to.equal(true);
    });
  });
});

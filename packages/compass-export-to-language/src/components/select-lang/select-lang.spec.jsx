import React from 'react';
import { mount, shallow } from 'enzyme';
import { expect } from 'chai';
import sinon from 'sinon';

import SelectLang from '../select-lang';
import Select from 'react-select-plus';

import styles from './select-lang.module.less';

describe('SelectLang [Component]', function () {
  context('when the component is rendered', function () {
    let component;

    const query = {filter: { category_code: 'smooth jazz', release_year: 2009 }};
    const outputLangChangedSpy = sinon.spy();
    const runTranspilerSpy = sinon.spy();
    const outputLang = 'python';

    const langOutputOptions = [
      { value: 'java', label: 'Java' },
      { value: 'javascript', label: 'Node' },
      { value: 'csharp', label: 'C#' },
      { value: 'python', label: 'Python 3' },
      { value: 'ruby', label: 'Ruby' },
      { value: 'go', label: 'Go' },
      { value: 'rust', label: 'Rust' },
      { value: 'php', label: 'PHP' }
    ];

    beforeEach(function () {
      component = mount(
        <SelectLang
          outputLangChanged={outputLangChangedSpy}
          outputLang={outputLang}
          runTranspiler={runTranspilerSpy}
          inputExpression={query}/>
      );
    });

    afterEach(function () {
      component = null;
    });

    it('renders the headers div', function () {
      expect(component.find(`.${styles['select-lang']}`)).to.be.present();
    });

    it('renders headers input text', function () {
      expect(component.find(Select)).prop('options').to.deep.equal(langOutputOptions);
    });

    it('value of the select box is python', function () {
      expect(component.find(Select).props().value).to.equal('python');
    });
  });

  context('when clicking on copy button', function () {
    let component;

    const query = {filer: { category_code: 'smooth jazz', release_year: 2009 }};
    const outputLangChangedSpy = sinon.spy();
    const runTranspilerSpy = sinon.spy();
    const outputLang = 'python';

    beforeEach(function () {
      component = shallow(
        <SelectLang
          outputLangChanged={outputLangChangedSpy}
          outputLang={outputLang}
          runTranspiler={runTranspilerSpy}
          inputExpression={query}/>
      );
    });

    afterEach(function () {
      component = null;
    });

    it('calls the run query method', function () {
      component.find(Select).simulate('change', { target: { value: 'java' } });
      expect(runTranspilerSpy.calledOnce).to.equal(true);
    });

    it('calls the set output lang method', function () {
      component.simulate('click');
      expect(outputLangChangedSpy.calledOnce).to.equal(true);
    });
  });
});

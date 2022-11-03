import React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { expect } from 'chai';
import Sinon from 'sinon';

import SelectLang from '../select-lang';

const selectTestId = 'export-to-language-select-lang';

const outputLang = 'python';

const selectableLanguages = [
  'Java',
  'Node',
  'C#',
  // 'Python 3', // Already selected
  'Ruby',
  'Go',
  'Rust',
  'PHP',
];

const query = {
  filter: { category_code: 'smooth jazz', release_year: 2009 },
};

describe('SelectLang', function() {
  let outputLangChangedSpy;
  let runTranspilerSpy;

  beforeEach(function() {
    outputLangChangedSpy = Sinon.spy();
    runTranspilerSpy = Sinon.spy();
    render(
      <SelectLang
        outputLangChanged={outputLangChangedSpy}
        outputLang={outputLang}
        runTranspiler={runTranspilerSpy}
        inputExpression={query}
      />
    );
  });

  afterEach(cleanup);

  it('should render a select', function() {
    expect(screen.getByTestId(selectTestId)).to.exist;
  });

  it('should show the initial type', function() {
    expect(screen.getByText('Python 3')).to.exist;
  });

  selectableLanguages.forEach((lang) => {
    it(`allows to select ${lang}`, function() {
      fireEvent.click(screen.getByTestId(selectTestId)); // Click select button
      expect(screen.getByText(lang)).to.exist;
    });
  });

  describe('when a lang is selected', function() {
    beforeEach(function() {
      fireEvent.click(screen.getByTestId(selectTestId)); // Click select button
      fireEvent.click(screen.getByText('Ruby')); // Click item
    });

    it('sets the output language and then reruns the transpiler', function() {
      expect(outputLangChangedSpy).to.have.been.calledBefore(runTranspilerSpy);
      expect(outputLangChangedSpy).to.have.been.calledOnceWithExactly('ruby');
      expect(runTranspilerSpy).to.have.been.calledOnceWithExactly(query);
    });
  });
});

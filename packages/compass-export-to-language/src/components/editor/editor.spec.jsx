import React from 'react';
import { mount } from 'enzyme';
import { expect } from 'chai';

import Editor from '../editor';
import AceEditor from 'react-ace';

import styles from './editor.module.less';

describe('Editor [Component]', function () {
  let component;

  beforeEach(function () {
    component = mount(
      <Editor language="python" value="transpiledExpression"/>
    );
  });

  afterEach(function () {
    component = null;
  });

  it('renders the headers div', function () {
    expect(component.find(`.${styles.editor}`)).to.be.present();
  });

  it('renders headers input text', function () {
    expect(component.find(`.${styles.editor}`)).to.have.descendants(AceEditor);
  });

  it('renders the editor with value', function () {
    expect(component.find(AceEditor)).prop('value').to.be.equal('transpiledExpression');
  });
});

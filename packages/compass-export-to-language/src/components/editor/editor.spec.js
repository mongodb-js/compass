import React from 'react';
import { mount } from 'enzyme';

import Editor from '../editor';
import AceEditor from 'react-ace';

import styles from './editor.module.less';

describe('Editor [Component]', () => {
  let component;

  beforeEach(() => {
    component = mount(
      <Editor language="python" value="transpiledExpression"/>
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

  it('renders the editor with value', () => {
    expect(component.find(AceEditor)).prop('value').to.be.equal('transpiledExpression');
  });
});

import React from 'react';
import { mount } from 'enzyme';
import ValidationSelector from 'components/validation-selector';

import styles from './validation-selector.less';

describe('ValidationSelector [Component]', () => {
  let component;
  const id = 'validation-action-selector';
  const bsSize = 'xs';
  const options = { warn: 'Warning', error: 'Error' };
  const label = [
    <span key="validation-action-span">Validation Action</span>,
    <p key="validation-action-span">Description</p>
  ];
  const title = 'Warning';
  const setOnSelect = sinon.spy();

  beforeEach(() => {
    component = mount(
      <ValidationSelector
        id={id}
        bsSize={bsSize}
        options={options}
        label={label}
        title={title}
        onSelect={setOnSelect} />
    );
  });

  afterEach(() => {
    component = null;
  });

  it('renders the wrapper div', () => {
    expect(component.find(`.${styles['option-selector-label']}`)).to.be.present();
  });
});

import React from 'react';
import { mount } from 'enzyme';
import { expect } from 'chai';
import sinon from 'sinon';

import ValidationSelector from '../validation-selector';

import styles from './validation-selector.module.less';

describe('ValidationSelector [Component]', function () {
  let component;
  const id = 'validation-action-selector';
  const bsSize = 'xs';
  const options = { warn: 'Warning', error: 'Error' };
  const label = [
    <span key="validation-action-label">Validation Action</span>,
    <p key="validation-action-description">Description</p>,
  ];
  const title = 'Warning';
  const setOnSelect = sinon.spy();

  beforeEach(function () {
    component = mount(
      <ValidationSelector
        id={id}
        bsSize={bsSize}
        options={options}
        label={label}
        title={title}
        onSelect={setOnSelect}
      />
    );
  });

  afterEach(function () {
    component = null;
  });

  it('renders the wrapper div', function () {
    expect(
      component.find(`.${styles['option-selector-label']}`)
    ).to.be.present();
  });
});

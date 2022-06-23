import React from 'react';
import { mount } from 'enzyme';
import { expect } from 'chai';

import SampleDocuments from '../sample-documents';
import styles from './sample-documents.module.less';

describe('SampleDocuments [Component]', function () {
  let component;

  beforeEach(function () {
    const sampleDocuments = {
      matching: {},
      notmatching: {},
      isLoading: false,
    };

    component = mount(<SampleDocuments sampleDocuments={sampleDocuments} />);
  });

  afterEach(function () {
    component = null;
  });

  it('renders the wrapper div', function () {
    expect(component.find(`.${styles['sample-documents']}`)).to.be.present();
  });
});

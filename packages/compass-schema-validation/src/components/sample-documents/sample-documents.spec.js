import React from 'react';
import { mount } from 'enzyme';
import SampleDocuments from 'components/sample-documents';
import styles from './sample-documents.less';

describe('SampleDocuments [Component]', () => {
  let component;

  beforeEach(() => {
    const sampleDocuments = {
      matching: {},
      notmatching: {},
      isLoading: false
    };

    component = mount(
      <SampleDocuments sampleDocuments={sampleDocuments} />
    );
  });

  afterEach(() => {
    component = null;
  });

  it('renders the wrapper div', () => {
    expect(component.find(`.${styles['sample-documents']}`)).to.be.present();
  });
});

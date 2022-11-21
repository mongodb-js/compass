import React from 'react';
import { mount } from 'enzyme';
import { expect } from 'chai';

import SampleDocuments from '../sample-documents';

describe('SampleDocuments [Component]', function () {
  it('renders matching and non-matching documents', function () {
    const sampleDocuments = {
      matching: {},
      notmatching: {},
      isLoading: false,
    };

    const component = mount(
      <SampleDocuments sampleDocuments={sampleDocuments} />
    );

    expect(
      component.find('[data-testid="matching-documents"]')
    ).to.be.present();
    expect(
      component.find('[data-testid="notmatching-documents"]')
    ).to.be.present();
  });
});

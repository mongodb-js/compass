import React from 'react';
import sinon from 'sinon';
import { mount } from 'enzyme';
import { expect } from 'chai';

import SampleDocuments from '../sample-documents';
import { INITIAL_STATE } from '../../modules/sample-documents';

describe('SampleDocuments [Component]', function () {
  const mountComponent = (props) => {
    const sampleDocuments = INITIAL_STATE;
    const fetchValidDocument = sinon.spy();
    const fetchInvalidDocument = sinon.spy();

    return mount(
      <SampleDocuments
        sampleDocuments={sampleDocuments}
        fetchValidDocument={fetchValidDocument}
        fetchInvalidDocument={fetchInvalidDocument}
        {...props}
      />
    );
  };

  it('renders matching and non-matching documents', function () {
    const component = mountComponent();
    expect(
      component.find('[data-testid="matching-documents"]')
    ).to.be.present();
    expect(
      component.find('[data-testid="notmatching-documents"]')
    ).to.be.present();
  });
});

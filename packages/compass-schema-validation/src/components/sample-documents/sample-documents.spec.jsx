import React from 'react';
import { mount } from 'enzyme'
import SampleDocuments from '../sample-documents';
import { expect } from 'chai';

describe('SampleDocuments [Component]', function () {
  it('renders a valid and invalid document preview', function () {
    const component = mount(<SampleDocuments
      renderValidDocument={() => <>Valid</>}
      renderInvalidDocument={() => <>Invalid</>}
    />);

    expect(
      component.find('[data-testid="matching-documents"]')
    ).to.be.present();
    expect(
      component.find('[data-testid="notmatching-documents"]')
    ).to.be.present();
  });
});

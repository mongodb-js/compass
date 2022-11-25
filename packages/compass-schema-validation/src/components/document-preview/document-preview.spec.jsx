import React from 'react';
import { shallow } from 'enzyme';
import { expect } from 'chai';

import DocumentPreview from '../document-preview';

describe('DocumentPreview [Component]', function () {
  it('renders a Document if there is a document', function () {
    const component = shallow(<DocumentPreview document={{}} />);
    expect(component.find('Document')).to.be.present();
  });

  it('renders No Preview Documents if there is no document', function () {
    const component = shallow(<DocumentPreview />);
    expect(component).to.have.text('No Preview Documents');
  });
});

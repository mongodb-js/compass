import React from 'react';
import { mount, shallow } from 'enzyme';
import { expect } from 'chai';

import DocumentPreview from '../document-preview';

describe('DocumentPreview [Component]', function () {
  it('renders a Document if there is a document', function () {
    const component = shallow(<DocumentPreview document={{}} />);
    expect(component.find('Document')).to.be.present();
  });

  it('renders No Preview Documents if there is no document', function () {
    const component = mount(<DocumentPreview document={undefined} />);
    expect(component).to.have.text('No Preview Documents');
  });

  it('renders a button to load a sample document if a document could be loaded', function () {
    const component = mount(<DocumentPreview document={null} />);
    expect(component.find('[data-testid="load-sample-document"]')).to.be.present();
  });
});

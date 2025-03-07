import React from 'react';
import { mount } from 'enzyme';
import { expect } from 'chai';

import { DocumentPreview } from './document-preview';

describe('DocumentPreview [Component]', function () {
  context('when document loading state is success', function () {
    it('renders a document if there is one present', function () {
      const component = mount(<DocumentPreview document={{}} />);
      expect(component.find('HadronDocument')).to.exist;
    });

    it('renders a no preview text when there is no document', function () {
      const component = mount(<DocumentPreview />);
      expect(component).to.have.text('No Preview Documents');
    });
  });
});

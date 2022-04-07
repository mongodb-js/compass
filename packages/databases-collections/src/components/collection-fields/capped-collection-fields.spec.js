import React from 'react';
import { mount } from 'enzyme';
import { expect } from 'chai';
import { Checkbox } from '@mongodb-js/compass-components';
import { TextInput } from '@mongodb-js/compass-components';

import CappedCollectionFields from './capped-collection-fields';

describe('CappedCollectionFields [Component]', () => {
  context('when isTimeSeries prop is true', () => {
    let component;

    beforeEach(() => {
      component = mount(
        <CappedCollectionFields
          isTimeSeries
          isCapped={false}
          isClustered={false}
          onChangeCappedSize={() => {}}
          onChangeIsCapped={() => {}}
          cappedSize={'0'}
        />
      );
    });

    afterEach(() => {
      component = null;
    });

    it('renders the checkbox disabled', () => {
      expect(component.find(Checkbox).props().disabled).to.equal(true);
    });
  });

  context('when isCapped prop is true', () => {
    let component;

    beforeEach(() => {
      component = mount(
        <CappedCollectionFields
          isTimeSeries={false}
          isCapped
          isClustered={false}
          onChangeCappedSize={() => {}}
          onChangeIsCapped={() => {}}
          cappedSize={'0'}
        />
      );
    });

    afterEach(() => {
      component = null;
    });

    it('renders the inputs ', () => {
      expect(component.find(TextInput).length).to.equal(1);
    });
  });

  context('when isTimeSeries prop is false', () => {
    let component;

    beforeEach(() => {
      component = mount(
        <CappedCollectionFields
          isTimeSeries={false}
          isCapped={false}
          isClustered={false}
          onChangeCappedSize={() => {}}
          onChangeIsCapped={() => {}}
          cappedSize={'0'}
        />
      );
    });

    afterEach(() => {
      component = null;
    });

    it('does not render the fields', () => {
      expect(component.find(TextInput).length).to.equal(0);
    });

    it('has the capped collection checkbox enabled', () => {
      expect(component.find(Checkbox).props().disabled).to.equal(false);
    });
  });
});

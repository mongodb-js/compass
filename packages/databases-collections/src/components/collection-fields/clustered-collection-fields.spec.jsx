import React from 'react';
import { mount } from 'enzyme';
import { expect } from 'chai';
import sinon from 'sinon';
import { Checkbox, TextInput } from '@mongodb-js/compass-components';

import ClusteredCollectionFields from './clustered-collection-fields';
import FieldSet from '../field-set/field-set';

describe('ClusteredCollectionFields [Component]', () => {
  context('when isClustered prop is true', () => {
    let component;

    beforeEach(() => {
      component = mount(
        <ClusteredCollectionFields
          isTimeSeries={false}
          isCapped={false}
          isClustered
          clusteredIndex={{}}
          onChangeIsClustered={() => {}}
          onChangeField={() => {}}
          expireAfterSeconds=""
        />
      );
    });

    afterEach(() => {
      component = null;
    });

    it('renders the field sets', () => {
      expect(component.find(FieldSet).length).to.equal(3);
    });
  });

  context('when isClustered prop is false', () => {
    let component;

    beforeEach(() => {
      component = mount(
        <ClusteredCollectionFields
          isTimeSeries={false}
          isCapped={false}
          isClustered={false}
          clusteredIndex={{}}
          onChangeIsClustered={() => {}}
          onChangeField={() => {}}
          expireAfterSeconds=""
        />
      );
    });

    afterEach(() => {
      component = null;
    });

    it('does not render the fields', () => {
      expect(component.find(FieldSet).length).to.equal(1);
    });

    it('has the clustered checkbox enabled', () => {
      expect(component.find(Checkbox).props().disabled).to.equal(false);
    });
  });

  describe('when the clustered checkbox is clicked', () => {
    let component;
    let onChangeSpy;

    beforeEach(() => {
      onChangeSpy = sinon.spy();
      component = mount(
        <ClusteredCollectionFields
          isTimeSeries={false}
          isCapped={false}
          isClustered={false}
          clusteredIndex={{}}
          onChangeIsClustered={onChangeSpy}
          onChangeField={() => {}}
          expireAfterSeconds=""
        />
      );
      component.find('input[type="checkbox"]').at(0).simulate(
        'change', { target: { checked: true } }
      );
      component.update();
    });

    afterEach(() => {
      component = null;
      onChangeSpy = null;
    });

    it('calls the onchange with time series collection on', () => {
      expect(onChangeSpy.callCount).to.equal(1);
      expect(onChangeSpy.firstCall.args[0]).to.deep.equal(true);
    });
  });

  describe('when the isCapped prop is true', () => {
    let component;

    beforeEach(() => {
      component = mount(
        <ClusteredCollectionFields
          isTimeSeries={false}
          isCapped
          isClustered={false}
          clusteredIndex={{}}
          onChangeIsClustered={() => {}}
          onChangeField={() => {}}
          expireAfterSeconds=""
        />
      );
    });

    afterEach(() => {
      component = null;
    });

    it('has the clustered checkbox disabled', () => {
      expect(component.find(Checkbox).props().disabled).to.equal(true);
    });
  });
});

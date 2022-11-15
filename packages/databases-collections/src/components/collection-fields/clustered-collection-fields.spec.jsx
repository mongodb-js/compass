import React from 'react';
import { mount } from 'enzyme';
import { expect } from 'chai';
import sinon from 'sinon';

import { FormFieldContainer } from '@mongodb-js/compass-components';
import ClusteredCollectionFields from './clustered-collection-fields';

describe('ClusteredCollectionFields [Component]', function () {
  context('when isClustered prop is true', function () {
    let component;

    beforeEach(function () {
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

    afterEach(function () {
      component = null;
    });

    it('renders the form field containers', function () {
      expect(component.find(FormFieldContainer).length).to.equal(3);
    });
  });

  context('when isClustered prop is false', function () {
    let component;

    beforeEach(function () {
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

    afterEach(function () {
      component = null;
    });

    it('does not render the fields', function () {
      expect(component.find(FormFieldContainer).length).to.equal(1);
    });

    it('has the clustered checkbox enabled', function () {
      expect(component.find('Checkbox').props().disabled).to.equal(false);
    });
  });

  describe('when the clustered checkbox is clicked', function () {
    let component;
    let onChangeSpy;

    beforeEach(function () {
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
      component
        .find('input[type="checkbox"]')
        .at(0)
        .simulate('change', { target: { checked: true } });
      component.update();
    });

    afterEach(function () {
      component = null;
      onChangeSpy = null;
    });

    it('calls the onchange with time series collection on', function () {
      expect(onChangeSpy.callCount).to.equal(1);
      expect(onChangeSpy.firstCall.args[0]).to.deep.equal(true);
    });
  });

  describe('when the isCapped prop is true', function () {
    let component;

    beforeEach(function () {
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

    afterEach(function () {
      component = null;
    });

    it('has the clustered checkbox disabled', function () {
      expect(component.find('Checkbox').props().disabled).to.equal(true);
    });
  });
});

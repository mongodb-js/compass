import React from 'react';
import { mount } from 'enzyme';
import { expect } from 'chai';
import sinon from 'sinon';
import { Checkbox } from '@mongodb-js/compass-components';

import FLE2Fields from './fle2-fields';
import FieldSet from '../field-set/field-set';

describe('FLE2Fields [Component]', () => {
  context('when isFLE2 prop is true', () => {
    let component;

    beforeEach(() => {
      component = mount(
        <FLE2Fields
          isTimeSeries={false}
          isCapped={false}
          isClustered={false}
          isFLE2
          configuredKMSProviders={['local']}
          currentTopologyType="ReplicaSetWithPrimary"
          fle2={{}}
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
      expect(component.find(FieldSet).length).to.equal(4);
    });
  });

  context('when isClustered prop is false', () => {
    let component;

    beforeEach(() => {
      component = mount(
        <FLE2Fields
          isTimeSeries={false}
          isCapped={false}
          isClustered={false}
          isFLE2={false}
          configuredKMSProviders={['local']}
          currentTopologyType="ReplicaSetWithPrimary"
          fle2={{}}
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

  describe('when the fle2 checkbox is clicked', () => {
    let component;
    let onChangeSpy;

    beforeEach(() => {
      onChangeSpy = sinon.spy();
      component = mount(
        <FLE2Fields
          isTimeSeries={false}
          isCapped={false}
          isClustered={false}
          isFLE2={false}
          configuredKMSProviders={['local']}
          currentTopologyType="ReplicaSetWithPrimary"
          fle2={{}}
          onChangeIsFLE2={onChangeSpy}
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

    it('calls the onchange with fle2 collection on', () => {
      expect(onChangeSpy.callCount).to.equal(1);
      expect(onChangeSpy.firstCall.args[0]).to.deep.equal(true);
    });
  });

  describe('when the isCapped prop is true', () => {
    let component;

    beforeEach(() => {
      component = mount(
        <FLE2Fields
          isTimeSeries={false}
          isCapped
          isClustered={false}
          configuredKMSProviders={['local']}
          currentTopologyType="ReplicaSetWithPrimary"
          fle2={{}}
          onChangeIsClustered={() => {}}
          onChangeField={() => {}}
          expireAfterSeconds=""
        />
      );
    });

    afterEach(() => {
      component = null;
    });

    it('has the FLE2 checkbox disabled', () => {
      expect(component.find(Checkbox).props().disabled).to.equal(true);
    });
  });

  describe('when the isTimeSeries prop is true', () => {
    let component;

    beforeEach(() => {
      component = mount(
        <FLE2Fields
          isTimeSeries
          isCapped={false}
          isClustered={false}
          configuredKMSProviders={['local']}
          currentTopologyType="ReplicaSetWithPrimary"
          fle2={{}}
          onChangeIsClustered={() => {}}
          onChangeField={() => {}}
          expireAfterSeconds=""
        />
      );
    });

    afterEach(() => {
      component = null;
    });

    it('has the FLE2 checkbox disabled', () => {
      expect(component.find(Checkbox).props().disabled).to.equal(true);
    });
  });
});

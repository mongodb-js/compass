import React from 'react';
import { mount } from 'enzyme';
import { expect } from 'chai';

import ExplainBody from '../explain-body';
import { ExplainSummary } from '../explain-summary';
import { ExplainTimeSeriesBanner } from '../explain-time-series-banner';
import { ExplainTree } from '../explain-tree';
import { ExplainJSON } from '../explain-json';
import EXPLAIN_VIEWS from '../../constants/explain-views';

describe('ExplainBody [Component]', () => {
  context('when its a time series collection', () => {
    let component;
    const explain = {
      viewType: EXPLAIN_VIEWS.tree,
      rawExplainObject: {},
      nReturned: 0,
      totalKeysExamined: 0,
      totalDocsExamined: 0,
      executionTimeMillis: 0,
      inMemorySort: false,
      indexType: 'UNAVAILABLE',
      index: null,
      isTimeSeriesExplain: true
    };
    const treeStages = {};
    const openLinkSpy = sinon.spy();

    beforeEach(() => {
      component = mount(
        <ExplainBody
          explain={explain}
          openLink={openLinkSpy}
          treeStages={treeStages}
        />);
    });

    afterEach(() => {
      component = null;
    });

    it('render the time series banner', () => {
      expect(component.find(ExplainTimeSeriesBanner)).to.be.present();
    });
  });

  context('when rendered with json view', () => {
    let component;
    const explain = {
      viewType: EXPLAIN_VIEWS.json,
      rawExplainObject: {},
      nReturned: 0,
      totalKeysExamined: 0,
      totalDocsExamined: 0,
      executionTimeMillis: 0,
      inMemorySort: false,
      indexType: 'UNAVAILABLE',
      index: null
    };
    const treeStages = {};
    const openLinkSpy = sinon.spy();

    beforeEach(() => {
      component = mount(
        <ExplainBody
          explain={explain}
          openLink={openLinkSpy}
          treeStages={treeStages}
        />);
    });

    afterEach(() => {
      component = null;
    });

    it('does not render the ExplainSummary component', () => {
      expect(component.find(ExplainSummary)).to.not.be.present();
    });

    it('renders the ExplainJSON component', () => {
      expect(component.find(ExplainJSON)).to.be.present();
    });
  });

  context('when rendered with tree view', () => {
    let component;
    const explain = {
      viewType: EXPLAIN_VIEWS.tree,
      rawExplainObject: {},
      nReturned: 0,
      totalKeysExamined: 0,
      totalDocsExamined: 0,
      executionTimeMillis: 0,
      inMemorySort: false,
      indexType: 'UNAVAILABLE',
      index: null
    };
    const treeStages = {};
    const openLinkSpy = sinon.spy();

    beforeEach(() => {
      component = mount(
        <ExplainBody
          explain={explain}
          openLink={openLinkSpy}
          treeStages={treeStages}
        />);
    });

    afterEach(() => {
      component = null;
    });

    it('renders the ExplainSummary component', () => {
      expect(component.find(ExplainSummary)).to.be.present();
    });

    it('does not render the ExplainJSON component', () => {
      expect(component.find(ExplainJSON)).to.not.be.present();
    });

    it('renders the ExplainSummary component', () => {
      expect(component.find(ExplainTree)).to.be.present();
    });

    it('does not render the time series banner', () => {
      expect(component.find(ExplainTimeSeriesBanner)).to.not.be.present();
    });
  });
});

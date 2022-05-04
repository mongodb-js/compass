import React from 'react';
import { mount } from 'enzyme';
import { expect } from 'chai';

import ExplainBody from '../explain-body';
import { ExplainSummary } from '../explain-summary';
import { ExplainCannotVisualizeBanner } from '../explain-cannot-visualize-banner';
import { ExplainTree } from '../explain-tree';
import { ExplainJSON } from '../explain-json';
import EXPLAIN_VIEWS from '../../constants/explain-views';

describe('ExplainBody [Component]', function () {
  context('when there is an error parsing the explain', function () {
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
      errorParsing: true,
    };
    const treeStages = {};

    beforeEach(function () {
      component = mount(
        <ExplainBody explain={explain} treeStages={treeStages} />
      );
    });

    afterEach(function () {
      component = null;
    });

    it('render the time series banner', function () {
      expect(component.find(ExplainCannotVisualizeBanner)).to.be.present();
    });
  });

  context('when rendered with json view', function () {
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
      index: null,
    };
    const treeStages = {};

    beforeEach(function () {
      component = mount(
        <ExplainBody explain={explain} treeStages={treeStages} />
      );
    });

    afterEach(function () {
      component = null;
    });

    it('does not render the ExplainSummary component', function () {
      expect(component.find(ExplainSummary)).to.not.be.present();
    });

    it('renders the ExplainJSON component', function () {
      expect(component.find(ExplainJSON)).to.be.present();
    });
  });

  context('when rendered with tree view', function () {
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
    };
    const treeStages = {};

    beforeEach(function () {
      component = mount(
        <ExplainBody explain={explain} treeStages={treeStages} />
      );
    });

    afterEach(function () {
      component = null;
    });

    it('renders the ExplainSummary component', function () {
      expect(component.find(ExplainSummary)).to.be.present();
    });

    it('does not render the ExplainJSON component', function () {
      expect(component.find(ExplainJSON)).to.not.be.present();
    });

    it('renders the ExplainTree component', function () {
      expect(component.find(ExplainTree)).to.be.present();
    });

    it('does not render the time series banner', function () {
      expect(component.find(ExplainCannotVisualizeBanner)).to.not.be.present();
    });
  });
});

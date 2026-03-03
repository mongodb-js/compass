import React from 'react';
import { render, screen, cleanup } from '@mongodb-js/testing-library-compass';
import { expect } from 'chai';
import sinon from 'sinon';
import userEvent from '@testing-library/user-event';

import BreadcrumbComponent from './breadcrumb';

describe('<BreadcrumbComponent />', function () {
  afterEach(cleanup);

  describe('#render', function () {
    describe('empty path', function () {
      it('renders the breadcrumb container with collection name and home icon', function () {
        const pathChanged = sinon.spy();
        render(
          <BreadcrumbComponent
            collection={'compass-crud'}
            pathChanged={pathChanged}
            path={[]}
            types={[]}
          />
        );

        const container = document.querySelector(
          '.ag-header-breadcrumb-container'
        );
        expect(container).to.exist;

        const tabs = screen.getAllByRole('button');
        expect(tabs).to.have.length(1);
        expect(tabs[0]).to.have.text('compass-crud');

        const homeIcon = container?.querySelector(
          '.ag-header-breadcrumb-home-icon'
        );
        expect(homeIcon).to.exist;
      });
    });

    describe('large path', function () {
      it('renders tabs for each path segment with correct names and types', function () {
        const pathChanged = sinon.spy();
        render(
          <BreadcrumbComponent
            collection={'compass-crud'}
            pathChanged={pathChanged}
            path={['a', 'b', 1]}
            types={['Object', 'Array', 'Object']}
          />
        );

        const tabs = screen.getAllByRole('button');
        expect(tabs).to.have.length(4);

        // First tab: collection name with home icon
        expect(tabs[0]).to.have.text('compass-crud');
        expect(tabs[0].querySelector('.ag-header-breadcrumb-home-icon')).to
          .exist;

        // 2nd tab: 'a' with Object type
        expect(tabs[1]).to.have.text('a { }');

        // 3rd tab: 'b' with Array type
        expect(tabs[2]).to.have.text('b [ ]');

        // 4th tab: 'b.1' with Object type, should be active
        expect(tabs[3]).to.have.text('b.1 { }');
        expect(tabs[3].classList.contains('ag-header-breadcrumb-tab-active')).to
          .be.true;
      });
    });
  });

  describe('#actions', function () {
    it('clicking on the home button calls pathChanged with empty arrays', function () {
      const pathChanged = sinon.spy();
      render(
        <BreadcrumbComponent
          collection={'compass-crud'}
          pathChanged={pathChanged}
          path={['a', 'b', 1]}
          types={['Object', 'Array', 'Object']}
        />
      );

      const tabs = screen.getAllByRole('button');
      userEvent.click(tabs[0]);

      expect(pathChanged.callCount).to.equal(1);
      expect(pathChanged.calledWith([], [])).to.be.true;
    });

    it('clicking on a tab triggers pathChanged with correct path slice', function () {
      const pathChanged = sinon.spy();
      render(
        <BreadcrumbComponent
          collection={'compass-crud'}
          pathChanged={pathChanged}
          path={['a', 'b', 1]}
          types={['Object', 'Array', 'Object']}
        />
      );

      const tabs = screen.getAllByRole('button');
      expect(tabs[1]).to.have.text('a { }');
      userEvent.click(tabs[1]);

      expect(pathChanged.callCount).to.equal(1);
      expect(pathChanged.calledWith(['a'], ['Object'])).to.be.true;
    });
  });
});

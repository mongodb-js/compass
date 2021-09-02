import React from 'react';
import { mount } from 'enzyme';
import Icon from '@leafygreen-ui/icon';

import styles from './sidebar-collection.less';
import SidebarCollection from '../sidebar-collection';

describe('SidebarCollection [Component]', () => {
  let component;
  let emitSpy;

  describe('is not active', () => {
    beforeEach(() => {
      emitSpy = sinon.spy();
      component = mount(<SidebarCollection
        _id="db.coll"
        database="db"
        capped={false}
        power_of_two={false}
        collections={[]}
        readonly={false}
        isWritable
        isDataLake={false}
        description="description"
        activeNamespace=""
        globalAppRegistryEmit={emitSpy}
        type="collection"
      />);
    });

    afterEach(() => {
      component = null;
      emitSpy = null;
    });

    it('mounts the root element', () => {
      expect(component.find(`.${styles['compass-sidebar-item']}`)).to.be.present();
    });

    it('does not register as active', () => {
      expect(component.find(`.${styles['compass-sidebar-item-is-active']}`)).to.be.not.present();
    });

    it('sets collection name', () => {
      expect(component.find('[data-test-id="sidebar-collection"]').text()).to.match(/coll/);
    });

    it('has a collection type icon', () => {
      expect(component.find(Icon).props().glyph).to.equal('Folder');
    });
  });

  describe('is active', () => {
    beforeEach(() => {
      emitSpy = sinon.spy();
      component = mount(<SidebarCollection
        _id="db.coll"
        database="db"
        capped={false}
        power_of_two={false}
        collections={[]}
        readonly={false}
        isWritable
        isDataLake={false}
        description="description"
        activeNamespace="db.coll"
        globalAppRegistryEmit={emitSpy}
      />);
    });

    afterEach(() => {
      component = null;
      emitSpy = null;
    });

    it('registers as active', () => {
      expect(component.find(`.${styles['compass-sidebar-item-is-active']}`)).to.be.present();
    });

    it('sets collection name', () => {
      expect(component.find('[data-test-id="sidebar-collection"]').text()).to.match(/coll/);
    });
  });

  describe('Views', () => {
    const pipeline = [ { $unwind: '$albums' }, { $project: { artist: '$name', title: '$albums.name' } }];
    beforeEach(() => {
      emitSpy = sinon.spy();
      component = mount(<SidebarCollection
        _id="echo.albums"
        database="echo"
        collections={[]}
        capped={false}
        power_of_two={false}
        type="view"
        pipeline={pipeline}
        view_on="artists"
        readonly
        isWritable
        isDataLake={false}
        description="description"
        activeNamespace="echo.albums"
        globalAppRegistryEmit={emitSpy}
      />);
    });

    afterEach(() => {
      component = null;
      emitSpy = null;
    });

    it('sets collection name', () => {
      expect(component.find('[data-test-id="sidebar-collection"]').text()).to.match(/albums/);
    });

    it('has a view icon', () => {
      expect(component.find(Icon)).to.be.present();
      expect(component.find(Icon).props().glyph).to.equal('Visibility');
    });

    describe('when the view is duplicated', () => {
      beforeEach(() => {
        component.findWhere(node => {
          return node.type() === 'a' && node.text() === 'Duplicate View';
        }).at(0).hostNodes().simulate('click');
      });

      it('calls the app registry with the view to duplicate', () => {
        expect(emitSpy.called).to.equal(true);
        expect(emitSpy.firstCall.args).to.deep.equal([
          'open-create-view',
          {
            source: 'echo.artists',
            pipeline,
            duplicate: true
          }
        ]);
      });
    });
  });

  describe('Time-Series', () => {
    beforeEach(() => {
      emitSpy = sinon.spy();
      component = mount(<SidebarCollection
        _id="db.coll"
        database="db"
        capped={false}
        power_of_two={false}
        collections={[]}
        readonly={false}
        isWritable
        isDataLake={false}
        description="description"
        type="timeseries"
        activeNamespace="db.coll"
        globalAppRegistryEmit={emitSpy}
      />);
    });

    afterEach(() => {
      component = null;
      emitSpy = null;
    });

    it('has a time series icon', () => {
      expect(component.find(Icon)).to.be.present();
      expect(component.find(Icon).props().glyph).to.equal('TimeSeries');
    });
  });
});

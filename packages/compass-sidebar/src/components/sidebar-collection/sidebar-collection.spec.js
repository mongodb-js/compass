import React from 'react';
import { mount } from 'enzyme';

import classnames from 'classnames';
import styles from './sidebar-collection.less';
import SidebarCollection from 'components/sidebar-collection';

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
      />);
    });

    afterEach(() => {
      component = null;
      emitSpy = null;
    });

    it('mounts the root element', () => {
      expect(component.find(`.${classnames(styles['compass-sidebar-item'])}`)).to.be.present();
    });

    it('does not register as active', () => {
      expect(component.find(`.${classnames(styles['compass-sidebar-item-is-active'])}`)).to.be.not.present();
    });

    it('sets collection name', () => {
      expect(component.find('[data-test-id="sidebar-collection"]').text()).to.equal('coll ');
    });

    it('does not register as readonly', () => {
      expect(component.find('[data-test-id="sidebar-collection-is-readonly"]')).to.be.not.present();
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
      expect(component.find(`.${classnames(styles['compass-sidebar-item-is-active'])}`)).to.be.present();
    });

    it('sets collection name', () => {
      expect(component.find('[data-test-id="sidebar-collection"]').text()).to.equal('coll ');
    });
  });

  describe('Views', () => {
    beforeEach(() => {
      emitSpy = sinon.spy();
      component = mount(<SidebarCollection
        _id="echo.albums"
        database="echo"
        collections={[]}
        capped={false}
        power_of_two={false}
        type="view"
        pipeline={[ { $unwind: '$albums' }, { $project: { artist: '$name', title: '$albums.name' } }]}
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
      expect(component.find('[data-test-id="sidebar-collection"]').text()).to.equal('albums ');
    });

    it('registers as readonly', () => {
      expect(component.find('[data-test-id="sidebar-collection-is-readonly"]')).to.be.present();
    });
  });
});

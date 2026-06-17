import { Double } from 'bson';
import { expect } from 'chai';
import Sinon from 'sinon';

import { UnthemedCoordinatesMinichart } from './coordinates-minichart';

const VALUES = [
  [-68.673123, 44.159235],
  [-68.6731339, 44.1592408],
  [-68.671159, 44.305953],
].map((v) => [new Double(v[0]), new Double(v[1])]);

const baseProps = () => ({
  type: {
    name: 'Coordinates',
    count: VALUES.length,
    probability: 1,
    values: VALUES,
  },
  fieldName: 'loc',
  onGeoQueryChanged: () => {},
  geoLayerAdded: () => {},
  geoLayersEdited: () => {},
  geoLayersDeleted: () => {},
});

describe('CoordinatesMinichart — lifecycle', function () {
  describe('componentDidUpdate', function () {
    let instance;
    let fitMapBoundsStub;
    let invalidateMapSizeStub;

    beforeEach(function () {
      instance = new UnthemedCoordinatesMinichart(baseProps());
      fitMapBoundsStub = Sinon.stub(instance, 'fitMapBounds');
      invalidateMapSizeStub = Sinon.stub(instance, 'invalidateMapSize');
    });

    afterEach(function () {
      Sinon.restore();
    });

    it('does not re-fit bounds when type.values reference is unchanged', function () {
      const prevProps = { ...instance.props, type: { ...instance.props.type } };
      instance.componentDidUpdate(prevProps, {}, undefined);
      expect(fitMapBoundsStub).to.not.have.been.called;
    });

    it('re-fits bounds when type.values reference changes', function () {
      const prevProps = {
        ...instance.props,
        type: { ...instance.props.type, values: [] },
      };
      instance.componentDidUpdate(prevProps, {}, undefined);
      expect(fitMapBoundsStub).to.have.been.calledOnce;
    });

    it('invalidates map size on every update', function () {
      const prevProps = { ...instance.props, type: { ...instance.props.type } };
      instance.componentDidUpdate(prevProps, {}, undefined);
      expect(invalidateMapSizeStub).to.have.been.calledOnce;
    });
  });

  describe('whenMapReady', function () {
    it('invalidates map size before fitting bounds on initial mount', function () {
      const instance = new UnthemedCoordinatesMinichart(baseProps());
      const callOrder = [];

      Sinon.stub(instance, 'invalidateMapSize').callsFake(() =>
        callOrder.push('invalidateMapSize')
      );
      Sinon.stub(instance, 'fitMapBounds').callsFake(() =>
        callOrder.push('fitMapBounds')
      );
      Sinon.stub(instance, 'disableAttributionPrefix');
      Sinon.stub(instance, 'getTileAttribution');
      // Outside React, run the setState callback synchronously so we can
      // observe the post-commit order.
      instance.setState = (next, cb) => {
        instance.state = { ...instance.state, ...next };
        if (cb) {
          cb();
        }
      };

      instance.whenMapReady();

      expect(callOrder).to.deep.equal(['invalidateMapSize', 'fitMapBounds']);

      Sinon.restore();
    });
  });
});

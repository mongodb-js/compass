import L from 'leaflet';
import { expect } from 'chai';
import sinon from 'sinon';

import { getHereAttributionMessage, getHereTileBoxes } from './utils';

describe('utils', function () {
  describe.skip('TODO: lucas: come back to this. getHereTileBoxes', function () {
    before(function () {
      // eslint-disable-next-line no-unused-vars
      const fetchResourceStub = sinon.stub().resolves({
        json: () => ({
          abnormal: [{}, {}],
          normal: [
            {
              label: 'Secret Organisation',
              alt: 'Copyright of Secret Organisation',
              minLevel: 5,
              maxLevel: 20,
              boxes: [
                [34.8037, 20.3974, 41.0512, 26.5331],
                [38.9687, 19.3748, 40.3571, 20.3974],
                [36.1209, 29.5552, 36.1723, 29.6034],
              ],
            },
            {
              label: 'Australia',
              alt: 'Copyright of the true blue',
              minLevel: 5,
              maxLevel: 20,
              boxes: [
                [-13.1672, 95.8626, -11.1672, 97.8626],
                [-11.5539, 104.6728, -9.5539, 106.6728],
                [-32.5901, 158.0863, -30.5901, 160.0863],
              ],
            },
          ],
        }),
      });
      // TODO: lucas: comeback to inject-loader and stubs way later.
      // getHereTileBoxes = getHereTileBoxesLoader({
      //   'utils/browser': {
      //     fetchResource: fetchResourceStub,
      //   },
      // }).getHereTileBoxes;
    });

    //   after(function() {
    //     getHereTileBoxes = null;
    //   });

    context('success', function () {
      it('returns the tile boxes on fetch', async function () {
        const result = await getHereTileBoxes();
        expect(result).to.be.deep.equal([
          {
            label: 'Secret Organisation',
            alt: 'Copyright of Secret Organisation',
            minLevel: 5,
            maxLevel: 20,
            boxes: [
              L.latLngBounds(
                L.latLng(34.8037, 20.3974),
                L.latLng(41.0512, 26.5331)
              ),
              L.latLngBounds(
                L.latLng(38.9687, 19.3748),
                L.latLng(40.3571, 20.3974)
              ),
              L.latLngBounds(
                L.latLng(36.1209, 29.5552),
                L.latLng(36.1723, 29.6034)
              ),
            ],
          },
          {
            label: 'Australia',
            alt: 'Copyright of the true blue',
            minLevel: 5,
            maxLevel: 20,
            boxes: [
              L.latLngBounds(
                L.latLng(-13.1672, 95.8626),
                L.latLng(-11.1672, 97.8626)
              ),
              L.latLngBounds(
                L.latLng(-11.5539, 104.6728),
                L.latLng(-9.5539, 106.6728)
              ),
              L.latLngBounds(
                L.latLng(-32.5901, 158.0863),
                L.latLng(-30.5901, 160.0863)
              ),
            ],
          },
        ]);
      });
    });
  });

  describe.skip('TODO: lucas: come back to this. getHereAttributionMessage', function () {
    before(function () {
      // TODO: lucas: comeback to inject-loader later.
      // getHereTileBoxesStub = sinon.stub().returns(
      //   Promise.resolve([
      //     {
      //       label: 'Secret Organisation',
      //       alt: 'Copyright of Secret Organisation',
      //       minLevel: 5,
      //       maxLevel: 20,
      //       boxes: [
      //         L.latLngBounds(
      //           L.latLng(34.8037, 20.3974),
      //           L.latLng(41.0512, 26.5331)
      //         ),
      //         L.latLngBounds(
      //           L.latLng(38.9687, 19.3748),
      //           L.latLng(40.3571, 20.3974)
      //         ),
      //         L.latLngBounds(
      //           L.latLng(-32.5901, 158.0863),
      //           L.latLng(-30.5901, 160.0863)
      //         ),
      //       ],
      //     },
      //     {
      //       label: 'Australia',
      //       alt: 'Copyright of the true blue',
      //       minLevel: 5,
      //       maxLevel: 20,
      //       boxes: [
      //         L.latLngBounds(
      //           L.latLng(-13.1672, 95.8626),
      //           L.latLng(-11.1672, 97.8626)
      //         ),
      //         L.latLngBounds(
      //           L.latLng(-11.5539, 104.6728),
      //           L.latLng(-9.5539, 106.6728)
      //         ),
      //         L.latLngBounds(
      //           L.latLng(-32.5901, 158.0863),
      //           L.latLng(-30.5901, 160.0863)
      //         ),
      //       ],
      //     },
      //     {
      //       label: 'Cats',
      //       alt: 'Copyright of the Felines',
      //       minLevel: 0,
      //       maxLevel: 5,
      //       boxes: [L.latLngBounds(L.latLng(-40, 95), L.latLng(-32, 97))],
      //     },
      //     {
      //       label: 'Dogs',
      //       alt: 'Copyright of the Canines',
      //       minLevel: 5,
      //       maxLevel: 20,
      //       boxes: [L.latLngBounds(L.latLng(-40, 95), L.latLng(-32, 97))],
      //     },
      //   ])
      // );
      // const bla = getHereAttributionMessageInjector({
      //   './get-here-tile-boxes': getHereTileBoxesStub,
      // });
      // getHereAttributionMessage = bla.getHereAttributionMessage;
    });

    //   after(function() {
    //     getHereAttributionMessage = null;
    //     getHereTileBoxesStub = null;
    //   });

    context('when generating the attribution message', function () {
      it('returns the default attribution if not in an overlapping area', async function () {
        const result = await getHereAttributionMessage(
          L.latLngBounds(L.latLng(20, 20), L.latLng(21, 21)),
          10
        );
        expect(result).to.be.equal(
          ' &copy; 1987-2019 HERE | <a href="https://legal.here.com/en/terms/serviceterms/us">Terms of Use</a>'
        );
      });

      it('returns an extra attribution if in bounds', async function () {
        const result = await getHereAttributionMessage(
          L.latLngBounds(L.latLng(34.9, 21), L.latLng(30, 25)),
          10
        );
        expect(result).to.be.equal(
          ' &copy; 1987-2019 HERE, Secret Organisation | <a href="https://legal.here.com/en/terms/serviceterms/us">Terms of Use</a>'
        );
      });

      it('returns multiple attributions if within bounds of multiple boxes', async function () {
        const result = await getHereAttributionMessage(
          L.latLngBounds(L.latLng(-32.4, 159), L.latLng(-31.5, 159)),
          10
        );
        expect(result).to.be.equal(
          ' &copy; 1987-2019 HERE, Secret Organisation, Australia | <a href="https://legal.here.com/en/terms/serviceterms/us">Terms of Use</a>'
        );
      });

      it('varies the attribute message with height', async function () {
        let result = await getHereAttributionMessage(
          L.latLngBounds(L.latLng(-39, 95.1), L.latLng(-33, 96)),
          3
        );
        expect(result).to.be.equal(
          ' &copy; 1987-2019 HERE, Cats | <a href="https://legal.here.com/en/terms/serviceterms/us">Terms of Use</a>'
        );

        result = await getHereAttributionMessage(
          L.latLngBounds(L.latLng(-39, 95.1), L.latLng(-33, 96)),
          10
        );
        expect(result).to.be.equal(
          ' &copy; 1987-2019 HERE, Dogs | <a href="https://legal.here.com/en/terms/serviceterms/us">Terms of Use</a>'
        );
      });
    });
  });
});

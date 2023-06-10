import { expect } from 'chai';
import { urlWithUtmParams, EXCLUDED_MONGODB_HOSTS } from './window-manager';

describe('window-manager', function () {
  describe('#helper - urlWithUtmParams', function () {
    context('when url is not a mongodb.com url', function () {
      it('should return the url as it is', function () {
        expect(urlWithUtmParams('https://go-mongodb.com/')).to.equal(
          'https://go-mongodb.com/'
        );

        expect(
          urlWithUtmParams('https://go-mongodb.com/?name=compass')
        ).to.equal('https://go-mongodb.com/?name=compass');
      });
    });

    context(
      'when url contains a valid mongodb hostname that is not supposed to have utm params',
      function () {
        it('should return the url as it is', function () {
          EXCLUDED_MONGODB_HOSTS.forEach(function (host) {
            expect(urlWithUtmParams(`${host}?name=Compass`)).to.equal(
              `${host}?name=Compass`
            );
          });
        });
      }
    );

    context(
      'when url contains a valid mongodb hostname and is supposed to have utm params',
      function () {
        it('should return the url with correct utm params set', function () {
          expect(
            urlWithUtmParams('https://docs.mongodb.com/compass/current/')
          ).to.equal(
            'https://docs.mongodb.com/compass/current/?utm_source=compass&utm_medium=product'
          );
          expect(
            urlWithUtmParams('https://mongodb.com/docs/anything/?name=compass')
          ).to.equal(
            'https://mongodb.com/docs/anything/?name=compass&utm_source=compass&utm_medium=product'
          );
          expect(
            urlWithUtmParams(
              'https://mongodb.com/?utm_source=shell&utm_medium=anythingelse'
            )
          ).to.equal(
            'https://mongodb.com/?utm_source=compass&utm_medium=product'
          );
        });
      }
    );
  });
});

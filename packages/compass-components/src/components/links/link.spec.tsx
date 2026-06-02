import React from 'react';
import { expect } from 'chai';
import { render, screen, cleanup } from '@mongodb-js/testing-library-compass';
import {
  urlWithUtmParams,
  RequiredURLSearchParamsProvider,
  Link,
  Button,
  IconButton,
} from './link';

const params = {
  utmSource: 'compass',
  utmMedium: 'product',
};

describe('link', function () {
  describe('#helper - urlWithUtmParams', function () {
    context('when url is not a mongodb.com url', function () {
      it('should return the url as it is', function () {
        expect(urlWithUtmParams('https://go-mongodb.com/', params)).to.equal(
          'https://go-mongodb.com/'
        );

        expect(
          urlWithUtmParams('https://go-mongodb.com/?name=compass', {})
        ).to.equal('https://go-mongodb.com/?name=compass');
      });
    });

    context(
      'when url contains a valid mongodb hostname and is supposed to have utm params',
      function () {
        it('should return the url with correct utm params set', function () {
          expect(
            urlWithUtmParams(
              'https://docs.mongodb.com/compass/current/',
              params
            )
          ).to.equal(
            'https://docs.mongodb.com/compass/current/?utm_source=compass&utm_medium=product'
          );
          expect(
            urlWithUtmParams(
              'https://mongodb.com/docs/anything/?name=compass',
              params
            )
          ).to.equal(
            'https://mongodb.com/docs/anything/?name=compass&utm_source=compass&utm_medium=product'
          );
          expect(
            urlWithUtmParams(
              'https://mongodb.com/?utm_source=shell&utm_medium=anythingelse',
              params
            )
          ).to.equal(
            // don't override existing vars
            'https://mongodb.com/?utm_source=shell&utm_medium=anythingelse'
          );
        });

        it('leaves the url unchanged if there are no utm params set', function () {
          expect(
            urlWithUtmParams('https://docs.mongodb.com/compass/current/', {})
          ).to.equal('https://docs.mongodb.com/compass/current/');
          expect(
            urlWithUtmParams(
              'https://mongodb.com/docs/anything/?name=compass',
              {}
            )
          ).to.equal('https://mongodb.com/docs/anything/?name=compass');
          expect(
            urlWithUtmParams(
              'https://mongodb.com/?utm_source=shell&utm_medium=anythingelse',
              {}
            )
          ).to.equal(
            'https://mongodb.com/?utm_source=shell&utm_medium=anythingelse'
          );
        });
      }
    );
  });

  describe('Link component', function () {
    afterEach(cleanup);

    it('should append utm params to mongodb.com hrefs', function () {
      render(
        <RequiredURLSearchParamsProvider
          utmSource="compass"
          utmMedium="product"
        >
          <Link href="https://www.mongodb.com/atlas/database" target="_blank">
            MongoDB Atlas
          </Link>
        </RequiredURLSearchParamsProvider>
      );

      const link = screen.getByRole('link', { name: /MongoDB Atlas/i });
      expect(link.getAttribute('href')).to.equal(
        'https://www.mongodb.com/atlas/database?utm_source=compass&utm_medium=product'
      );
    });
  });

  describe('Button component', function () {
    afterEach(cleanup);

    it('should append utm params to mongodb.com hrefs', function () {
      render(
        <RequiredURLSearchParamsProvider
          utmSource="compass"
          utmMedium="product"
        >
          <Button
            href="https://www.mongodb.com/cloud/atlas/lp/try4"
            target="_blank"
          >
            CREATE FREE CLUSTER
          </Button>
        </RequiredURLSearchParamsProvider>
      );

      const link = screen.getByRole('link', {
        name: /CREATE FREE CLUSTER/i,
      });
      expect(link.getAttribute('href')).to.equal(
        'https://www.mongodb.com/cloud/atlas/lp/try4?utm_source=compass&utm_medium=product'
      );
    });

    it('should not add utm params to non-mongodb.com hrefs', function () {
      render(
        <RequiredURLSearchParamsProvider
          utmSource="compass"
          utmMedium="product"
        >
          <Button href="https://example.com/page" target="_blank">
            External
          </Button>
        </RequiredURLSearchParamsProvider>
      );

      const link = screen.getByRole('link', { name: /External/i });
      expect(link.getAttribute('href')).to.equal('https://example.com/page');
    });
  });

  describe('IconButton component', function () {
    afterEach(cleanup);

    it('should append utm params to mongodb.com hrefs', function () {
      render(
        <RequiredURLSearchParamsProvider
          utmSource="compass"
          utmMedium="product"
        >
          <IconButton
            href="https://www.mongodb.com/docs"
            target="_blank"
            aria-label="Docs"
          />
        </RequiredURLSearchParamsProvider>
      );

      const link = screen.getByRole('link', { name: /Docs/i });
      expect(link.getAttribute('href')).to.equal(
        'https://www.mongodb.com/docs?utm_source=compass&utm_medium=product'
      );
    });
  });
});

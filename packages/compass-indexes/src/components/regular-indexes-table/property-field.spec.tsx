import React from 'react';
import { cleanup, render, screen, within } from '@testing-library/react';
import { expect } from 'chai';

import PropertyField, { getPropertyTooltip } from './property-field';
import getIndexHelpLink from '../../utils/index-link-helper';

describe('PropertyField', function () {
  before(cleanup);
  afterEach(cleanup);
  describe('PropertyField Component', function () {
    it('renders index properties', function () {
      render(
        <PropertyField
          cardinality={'single'}
          extra={{
            expireAfterSeconds: 120,
            partialFilterExpression: { col: true },
          }}
          properties={['ttl', 'partial']}
        />
      );

      ['ttl', 'partial'].forEach((type) => {
        const badge = screen.getByTestId(`${type}-badge`);
        expect(badge).to.exist;
        expect(badge.textContent).to.equal(type);
        const infoIcon = within(badge).getByRole('img', {
          name: /info with circle icon/i,
        });
        expect(infoIcon).to.exist;
        expect(infoIcon.closest('a')?.href).to.equal(
          getIndexHelpLink(type.toUpperCase() as any)
        );
      });
    });

    it('does not render cardinality badge when its single', function () {
      render(
        <PropertyField cardinality={'single'} extra={{}} properties={[]} />
      );
      expect(() => {
        screen.getByTestId('compound-badge');
      }).to.throw;
    });

    it('renders cardinality badge when its compound', function () {
      render(
        <PropertyField cardinality={'compound'} extra={{}} properties={[]} />
      );
      const badge = screen.getByTestId('compound-badge');
      expect(badge).to.exist;
      expect(badge.textContent).to.equal('compound');
      const infoIcon = within(badge).getByRole('img', {
        name: /info with circle icon/i,
      });
      expect(infoIcon).to.exist;
      expect(infoIcon.closest('a')?.href).to.equal(
        getIndexHelpLink('COMPOUND')
      );
    });

    it('renders hidden badge when its hidden', function () {
      render(
        <PropertyField
          cardinality={'single'}
          extra={{ hidden: 'true' }}
          properties={[]}
        />
      );
      const badge = screen.getByTestId('HIDDEN-badge');
      expect(badge).to.exist;
      expect(badge.textContent).to.equal('HIDDEN');
      const infoIcon = within(badge).getByRole('img', {
        name: /info with circle icon/i,
      });
      expect(infoIcon).to.exist;
      expect(infoIcon.closest('a')?.href).to.equal(getIndexHelpLink('HIDDEN'));
    });
  });

  describe('getPropertyTooltip', function () {
    it('returns ttl tooltip', function () {
      expect(
        getPropertyTooltip('ttl', {
          expireAfterSeconds: 200,
        })
      ).to.equal('expireAfterSeconds: 200');
    });

    it('returns partial tooltip', function () {
      expect(
        getPropertyTooltip('partial', {
          partialFilterExpression: { _id: true },
        })
      ).to.equal(`partialFilterExpression: ${JSON.stringify({ _id: true })}`);
    });

    it('returns null for unsupported properties', function () {
      ['unique', 'sparse', 'collation'].forEach(
        (prop) => expect(getPropertyTooltip(prop as any, {})).to.be.null
      );
    });
  });
});

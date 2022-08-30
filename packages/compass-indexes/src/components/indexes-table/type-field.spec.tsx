import React from 'react';
import { cleanup, render, screen, within } from '@testing-library/react';
import { expect } from 'chai';

import TypeField, { IndexTypeTooltip, canRenderTooltip } from './type-field';
import getIndexHelpLink from '../../utils/index-link-helper';

describe('TypeField', function () {
  before(cleanup);
  afterEach(cleanup);
  describe('TypeField Component', function () {
    it('renders index type', function () {
      render(<TypeField type="text" extra={{}} />);

      const badge = screen.getByTestId('text-badge');
      expect(badge).to.exist;

      expect(badge.textContent).to.equal('text');
      const infoIcon = within(badge).getByRole('img', {
        name: /info with circle icon/i,
      });
      expect(infoIcon).to.exist;
      expect(infoIcon.closest('a')?.href).to.equal(getIndexHelpLink('TEXT'));
    });

    it('renders index type - with extra information', function () {
      render(
        <TypeField
          type="hashed"
          extra={{
            wildcardProjection: { _id: true },
          }}
        />
      );

      const badge = screen.getByTestId('hashed-badge');
      expect(badge).to.exist;
    });
  });

  describe('IndexTypeTooltip Component', function () {
    it('renders allowed props in tooltip', function () {
      const extras: any = {
        weights: 20,
        default_language: 'de',
        language_override: 'en',
        wildcardProjection: { _id: true },
        columnstoreProjection: { name: false },
      };
      render(<IndexTypeTooltip extra={extras} />);
      for (const key in extras) {
        expect(
          screen.getByText(`${key}: ${JSON.stringify(extras[key])}`),
          `it renders ${key} prop in tooltip`
        ).to.exist;
      }
    });

    it('does not render disallowed props in tooltip', function () {
      const extras: any = {
        expireAfterSeconds: 200,
        partialFilterExpression: { _id: true },
      };
      render(<IndexTypeTooltip extra={extras} />);
      for (const key in extras) {
        expect(
          () => screen.getByText(`${key}: ${JSON.stringify(extras[key])}`),
          `it does not render ${key} prop in tooltip`
        ).to.throw;
      }
    });
  });

  describe('canRenderTooltip function', function () {
    it('renders tooltip', function () {
      ['text', 'wildcard', 'columnstore'].forEach(
        (x) =>
          expect(
            canRenderTooltip(x as any),
            `it renders tooltip when type is ${x}`
          ).to.be.true
      );
    });
    it('does not render tooltip', function () {
      ['geo', 'hashed', 'clustered'].forEach(
        (x) =>
          expect(
            canRenderTooltip(x as any),
            `it does not render tooltip when type is ${x}`
          ).to.be.false
      );
    });
  });
});

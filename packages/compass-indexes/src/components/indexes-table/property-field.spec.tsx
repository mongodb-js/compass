import React from 'react';
import { cleanup, render, screen, within } from '@testing-library/react';
import { expect } from 'chai';

import PropertyField from './property-field';
import getIndexHelpLink from '../../utils/index-link-helper';

describe('PropertyField Component', function () {
  before(cleanup);
  afterEach(cleanup);
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

      // todo: tooltip tests
    });
  });

  it('does not render cardinality badge when its single', function () {
    render(<PropertyField cardinality={'single'} extra={{}} properties={[]} />);
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
    expect(infoIcon.closest('a')?.href).to.equal(getIndexHelpLink('COMPOUND'));
  });
});

import React from 'react';
import { expect } from 'chai';
import { screen } from '@mongodb-js/testing-library-compass';
import {
  ShardKeyInvalid,
  type ShardKeyInvalidProps,
} from './shard-key-invalid';
import { renderWithStore } from '../../../tests/create-store';

describe('ShardKeyInvalid', function () {
  const baseProps: ShardKeyInvalidProps = {
    namespace: 'db1.coll1',
    shardKey: {
      fields: [
        { type: 'HASHED', name: 'not-location' },
        { type: 'RANGE', name: 'secondary' },
      ],
      isUnique: false,
    },
  };

  function renderWithProps(
    props?: Partial<ShardKeyInvalidProps>,
    options?: Parameters<typeof renderWithStore>[1]
  ) {
    return renderWithStore(
      <ShardKeyInvalid {...baseProps} {...props} />,
      options
    );
  }

  it('Describes next steps', async function () {
    await renderWithProps();

    expect(screen.findByText(/Please migrate the data in this collection/)).to
      .exist;
  });

  it('Describes the shardKey (with metadata)', async function () {
    await renderWithProps();

    const title = await screen.findByTestId(
      'existing-shardkey-description-title'
    );
    expect(title).to.be.visible;
    expect(title.textContent).to.equal(
      `${baseProps.namespace} is configured with the following shard key:`
    );
    const list = await screen.findByTestId(
      'existing-shardkey-description-content'
    );
    expect(list).to.be.visible;
    expect(list.textContent).to.contain(
      `"not-location" (hashed), "secondary" (range)`
    );
    expect(list.textContent).to.contain(`unique: false`);
  });
});

import React from 'react';
import { expect } from 'chai';
import { render, screen, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { UpdateSearchIndexModal } from './update-search-index-modal';

const knnVectorText = 'KNN Vector field mapping';

function renderUpdateSearchIndexModal(
  props?: Partial<React.ComponentProps<typeof UpdateSearchIndexModal>>
) {
  return render(
    <UpdateSearchIndexModal
      namespace="test.test"
      indexName="testIndex"
      isVectorSearchSupported
      indexDefinition="testDefinition"
      isModalOpen={true}
      isBusy={false}
      onUpdateIndex={() => {}}
      onCloseModal={() => {}}
      error={'Invalid index definition.'}
      {...props}
    />
  );
}

describe('Base Search Index Modal', function () {
  afterEach(cleanup);

  describe('when rendered', function () {
    beforeEach(function () {
      renderUpdateSearchIndexModal();
    });

    it('does not show the KNN vector field mapping template', function () {
      userEvent.click(screen.getByRole('button', { name: 'Template' }));
      expect(screen.queryByRole('option', { name: knnVectorText })).to.not
        .exist;
    });
  });

  describe('when rendered and isVectorSearchSupported is false', function () {
    beforeEach(function () {
      renderUpdateSearchIndexModal({
        isVectorSearchSupported: false,
      });
    });

    it('shows the KNN vector field mapping template', function () {
      userEvent.click(screen.getByRole('button', { name: 'Template' }));
      expect(screen.getByRole('option', { name: knnVectorText })).to.be.visible;
    });
  });
});

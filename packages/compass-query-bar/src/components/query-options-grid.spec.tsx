import React, { ComponentProps } from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect } from 'chai';
import { spy } from 'sinon';
import type { SinonSpy } from 'sinon';

import { QueryOptionsGrid, getGridTemplateForQueryOptions } from './query-options-grid';
import type { QueryOption } from '../constants/query-option-definition';

const renderQueryOptionsGrid = (
  props: Partial<ComponentProps<typeof QueryOptionsGrid>> = {}
) => {
  const defaultQueryOptions: QueryOption[] = ['project', 'sort', 'collation', 'skip', 'limit', 'maxTimeMS'];

  render(
    <QueryOptionsGrid
      buttonLabel = 'Apply',
      expanded: isQueryOptionsExpanded = false,
      queryOptions: 
      onApply: _onApply,
      onChangeQueryOption,
      onReset: _onReset,
      queryState,
      refreshEditorAction,
      schemaFields,
      serverVersion,
      showQueryHistoryButton = true,
      toggleExpandQueryOptions,
      toggleQueryHistory: _toggleQueryHistory,
      valid: isQueryValid,
      ...queryOptionProps
      onRunExplain={() => {}}
      {...props}
    />
  );
};

describe('OptionGrid Component', function () {
  describe('#getGridTemplateForQueryOptions', function() {
    it('returns a grid template for a single document editor', function() {
      const gridTemplate = OptionGrid.getGridTemplateForQueryOptions(['a']);
      expect(gridTemplate).to.equal(`
        'a docsLink'
      `);
    });
  })

  describe('when rendered', function () {
    let onSaveSpy: SinonSpy;
    let onSaveAsSpy: SinonSpy;
    let onCreateViewSpy: SinonSpy;
    beforeEach(function () {
      onSaveSpy = spy();
      onSaveAsSpy = spy();
      onCreateViewSpy = spy();
      render(
        <OptionGrid
          isCreateViewAvailable={true}
          pipelineName={'Name'}
          onSave={onSaveSpy}
          onSaveAs={onSaveAsSpy}
          onCreateView={onCreateViewSpy}
        />
      );
    });

    it('renders the entire option grid', function () {
      const menu = screen.getByTestId('save-menu');
      expect(menu).to.exist;

      userEvent.click(menu);

      const menuContent = screen.getByTestId('save-menu-content');
      expect(within(menuContent).getByLabelText('Save')).to.exist;
      expect(within(menuContent).getByLabelText('Save as')).to.exist;
      expect(within(menuContent).getByLabelText('Create view')).to.exist;
    });
  });
});

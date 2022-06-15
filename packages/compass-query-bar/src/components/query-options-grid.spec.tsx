import React from 'react';
import type { ComponentProps } from 'react';
import { render, screen } from '@testing-library/react';
import { expect } from 'chai';

import {
  QueryOptionsGrid,
  getGridTemplateForQueryOptions,
} from './query-options-grid';
import type { QueryOption } from '../constants/query-option-definition';

const queryOptionProps = {
  filterValid: true,
  filterString: '',

  projectValid: true,
  projectString: '',

  sortValid: true,
  sortString: '',

  collationValid: true,
  collationString: '',

  skipValid: true,
  skipString: '',

  limitValid: true,
  limitString: '',

  maxTimeMSValid: true,
  maxTimeMSString: '',
};

const defaultQueryOptions: QueryOption[] = [
  'project',
  'sort',
  'collation',
  'skip',
  'limit',
  'maxTimeMS',
];

const renderQueryOptionsGrid = (
  props: Partial<ComponentProps<typeof QueryOptionsGrid>> = {}
) => {
  render(
    <QueryOptionsGrid
      queryOptions={defaultQueryOptions}
      onApply={() => {
        /* noop */
      }}
      onChangeQueryOption={() => {
        /* noop */
      }}
      queryOptionProps={queryOptionProps}
      refreshEditorAction={
        {
          listen: () => {
            return () => {
              /* noop */
            };
          },
        } as any
      }
      schemaFields={[]}
      serverVersion={'1.2.3'}
      {...props}
    />
  );
};

describe('OptionGrid Component', function () {
  describe('#getGridTemplateForQueryOptions', function () {
    it('returns a grid template for a single document editor', function () {
      const gridTemplate = getGridTemplateForQueryOptions(['project']);
      expect(gridTemplate).to.equal(`
  'project project project project project docsLink'
`);
    });

    it('returns a grid template for a double document editor', function () {
      const gridTemplate = getGridTemplateForQueryOptions([
        'project',
        'sort',
        'skip',
        'limit',
        'maxTimeMS',
      ]);
      expect(gridTemplate).to.equal(`
  'project project project sort sort sort'
  '. . skip limit maxTimeMS docsLink'
`);
    });

    it('returns a grid template for a double document editor without numerics', function () {
      const gridTemplate = getGridTemplateForQueryOptions(['project', 'sort']);
      expect(gridTemplate).to.equal(`
  'project project project project project project'
  'sort sort sort sort sort docsLink'
`);
    });

    it('returns a grid template for a triple document editor', function () {
      const gridTemplate = getGridTemplateForQueryOptions([
        'project',
        'sort',
        'collation',
      ]);
      expect(gridTemplate).to.equal(`
  'project project project sort sort sort'
  'collation collation skip limit maxTimeMS docsLink'
`);
    });

    it('returns a grid template for the default options', function () {
      const gridTemplate = getGridTemplateForQueryOptions(defaultQueryOptions);
      expect(gridTemplate).to.equal(`
  'project project project sort sort sort'
  'collation collation skip limit maxTimeMS docsLink'
`);
    });

    it('returns a grid template for the numeric options', function () {
      const gridTemplate = getGridTemplateForQueryOptions([
        'limit',
        'skip',
        'maxTimeMS',
      ]);
      expect(gridTemplate).to.equal(`'skip limit maxTimeMS docsLink'`);
    });
  });

  describe('layout: one document option', function () {
    beforeEach(function () {
      renderQueryOptionsGrid({
        queryOptions: ['project'],
      });
    });

    it('renders the project option', function () {
      expect(screen.getByTestId('query-bar-option-project')).to.be.visible;
    });

    it('does not render the sort option', function () {
      expect(screen.queryByTestId('query-bar-option-sort')).to.not.exist;
    });

    it('does not render the maxTimeMS option', function () {
      expect(screen.queryByTestId('query-bar-option-maxTimeMS')).to.not.exist;
    });
  });

  describe('when rendered', function () {
    beforeEach(function () {
      renderQueryOptionsGrid();
    });

    it('renders all of the options', function () {
      expect(screen.getByTestId('query-bar-option-project')).to.be.visible;
      expect(screen.getByTestId('query-bar-option-sort')).to.be.visible;
      expect(screen.getByTestId('query-bar-option-collation')).to.be.visible;
      expect(screen.getByTestId('query-bar-option-skip')).to.be.visible;
      expect(screen.getByTestId('query-bar-option-limit')).to.be.visible;
      expect(screen.getByTestId('query-bar-option-maxTimeMS')).to.be.visible;
    });

    it('renders a docs link', function () {
      expect(screen.getByText('Learn more').closest('a'))
        .attribute('href')
        .to.be.equal('https://docs.mongodb.com/compass/current/query/filter/');
    });
  });
});

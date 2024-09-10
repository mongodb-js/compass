import React from 'react';
import { expect } from 'chai';
import {
  cleanup,
  render,
  screen,
  waitFor,
} from '@mongodb-js/testing-library-compass';
import { VirtualList, type VirtualListProps } from './virtual-list';

type Doc = {
  id: number;
  renderHeight: number;
};

const docs: Doc[] = [
  {
    id: 1,
    renderHeight: 200,
  },
  {
    id: 2,
    renderHeight: 10,
  },
  {
    id: 3,
    renderHeight: 500,
  },
];

function defaultItemRenderer(doc: Doc, ref: React.Ref<HTMLDivElement>) {
  return (
    <div ref={ref} style={{ height: `${doc.renderHeight}px` }}>
      Div - {doc.id}
    </div>
  );
}

const defaultProps: VirtualListProps<Doc> = {
  items: docs,
  renderItem: defaultItemRenderer,
  estimateItemInitialHeight(item) {
    return item.renderHeight;
  },
  __TEST_LIST_WIDTH: 300,
  __TEST_LIST_HEIGHT: 800,
};

describe('VirtualList', function () {
  afterEach(function () {
    cleanup();
  });

  it('renders the docs in the visible viewport', async function () {
    render(<VirtualList {...defaultProps} />);
    await waitFor(() => {
      // Expecting all three divs to be visible because the viewport can house
      // them all
      expect(screen.getByText('Div - 1')).to.be.visible;
      expect(screen.getByText('Div - 2')).to.be.visible;
      expect(screen.getByText('Div - 3')).to.be.visible;
    });
  });

  it('respects the overscan count', async function () {
    render(
      <VirtualList
        {...defaultProps}
        overScanCount={1}
        __TEST_LIST_HEIGHT={10}
      />
    );
    await waitFor(() => {
      expect(screen.getByText('Div - 1')).to.be.visible;
      expect(() => screen.getByText('Div - 2')).to.throw();
      expect(() => screen.getByText('Div - 3')).to.throw();
    });
  });

  it('respects the rowGap', function () {
    render(
      <VirtualList {...defaultProps} rowGap={4} itemDataTestId="list-item" />
    );

    const listItems = screen.getAllByTestId('list-item');
    // The height of each list item is <rowGap> + item size
    expect(listItems[0].style.height).to.equal(`${200 + 4}px`);
    expect(listItems[1].style.height).to.equal(`${10 + 4}px`);
    // last item does not get a height change
    expect(listItems[2].style.height).to.equal('500px');
  });

  it('applies the initialScrollTop', function () {
    const scrollRef = React.createRef<HTMLDivElement>();
    render(
      <VirtualList
        {...defaultProps}
        initialScrollTop={100}
        scrollableContainerRef={scrollRef}
      />
    );
    expect(scrollRef.current?.scrollTop).to.equal(100);
  });
});

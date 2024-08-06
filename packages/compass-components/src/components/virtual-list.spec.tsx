import React from 'react';
import { expect } from 'chai';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
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
      expect(() => screen.getByText('Div - 2')).to.throw;
      expect(() => screen.getByText('Div - 3')).to.throw;
    });
  });

  it('respects the rowGap', function () {
    render(
      <VirtualList {...defaultProps} rowGap={4} itemDataTestId="list-item" />
    );

    const listItems = screen.getAllByTestId('list-item');
    // The top of each list item is <rowGap> + previous item size
    expect(listItems[0].style.top).to.equal('0px');
    expect(listItems[1].style.top).to.equal(`${200 + 4}px`);
    // top of previous items also gets applied
    expect(listItems[2].style.top).to.equal(`${200 + 4 + (10 + 4)}px`);
  });

  it('respects the paddingTop and paddingBottom', function () {
    render(
      <VirtualList {...defaultProps} paddingTop={10} paddingBottom={10} />
    );

    const overflowedContainer = screen.getByTestId(
      'virtual-list-overflowed-container'
    );
    const totalHeightOfDocs = docs.reduce(
      (totalHeight, { renderHeight }) => totalHeight + renderHeight,
      0
    );
    const totalHeightAddedByPadding = 10 + 10;
    const expectedHeight = totalHeightOfDocs + totalHeightAddedByPadding;
    expect(overflowedContainer.style.height).to.equal(`${expectedHeight}px`);
  });

  it('respects the paddingTop and paddingBottom in conjunction with rowGap', function () {
    render(
      <VirtualList
        {...defaultProps}
        rowGap={10}
        paddingTop={10}
        paddingBottom={10}
      />
    );

    const overflowedContainer = screen.getByTestId(
      'virtual-list-overflowed-container'
    );
    const totalHeightOfDocs = docs.reduce(
      (totalHeight, { renderHeight }) => totalHeight + renderHeight,
      0
    );
    const totalHeightAddedByPadding = 10 + 10;
    // Because gaps are inserted after first item
    const totalHeightAddedByRowGap = 10 * (docs.length - 1);
    const expectedHeight =
      totalHeightOfDocs + totalHeightAddedByPadding + totalHeightAddedByRowGap;
    expect(overflowedContainer.style.height).to.equal(`${expectedHeight}px`);
  });

  it('respects the paddingLeft and paddingRight', function () {
    render(
      <VirtualList
        {...defaultProps}
        paddingLeft={10}
        paddingRight={10}
        itemDataTestId="list-item"
      />
    );

    const listItems = screen.getAllByTestId('list-item');
    // The top of each list item is <rowGap> + previous item size
    expect(listItems[0].style.left).to.equal('10px');
    expect(listItems[0].style.width).to.equal('calc(100% - 20px)');

    expect(listItems[1].style.left).to.equal('10px');
    expect(listItems[1].style.width).to.equal('calc(100% - 20px)');

    expect(listItems[2].style.left).to.equal('10px');
    expect(listItems[2].style.width).to.equal('calc(100% - 20px)');
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

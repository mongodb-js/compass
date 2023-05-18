import React from 'react';
import Sinon from 'sinon';
import { render, cleanup, screen } from '@testing-library/react';
import { expect } from 'chai';
import * as DndKit from '@dnd-kit/core';
import UseCaseDroppableArea from '.';

describe('UseCaseDroppableArea', function () {
  afterEach(cleanup);

  it('should render the children when provided', function () {
    render(
      <UseCaseDroppableArea index={1}>
        <p>Hello</p>
      </UseCaseDroppableArea>
    );
    expect(screen.queryByTestId('use-case-drop-marker-1')).to.be.null;
    expect(screen.getByText('Hello')).to.not.throw;
  });

  it('should render the drop marker when useDraggable reports isOver=true', function () {
    const sandbox = Sinon.createSandbox();
    const useDroppableFake = () => ({ isOver: true } as any);
    sandbox.stub(DndKit, 'useDroppable').callsFake(useDroppableFake);
    render(
      <UseCaseDroppableArea index={1}>
        <p>Hello</p>
      </UseCaseDroppableArea>
    );
    expect(screen.getByTestId('use-case-drop-marker-1')).to.not.throw;
    expect(screen.queryByText('Hello')).to.be.null;
    sandbox.restore();
  });
});

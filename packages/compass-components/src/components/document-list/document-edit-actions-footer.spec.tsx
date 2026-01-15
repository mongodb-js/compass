import React from 'react';
import { expect } from 'chai';
import { render, screen, userEvent } from '@mongodb-js/testing-library-compass';
import HadronDocument from 'hadron-document';
import DocumentEditActionsFooter from './document-edit-actions-footer';
import Sinon from 'sinon';

const DEFAULT_PROPS = {
  doc: new HadronDocument({}),
  editing: true,
  deleting: false,
  onDelete: () => {},
  onUpdate: () => {},
  validationError: null,
} as const;

describe('DocumentEditActionsFooter', function () {
  it('should render the error message', function () {
    const { rerender } = render(
      <DocumentEditActionsFooter
        {...DEFAULT_PROPS}
        validationError={new Error('Invalid JSON')}
      />
    );
    expect(screen.getByText('Invalid JSON')).to.exist;
    rerender(
      <DocumentEditActionsFooter {...DEFAULT_PROPS} validationError={null} />
    );
    expect(screen.queryByText('Invalid JSON')).to.not.exist;
  });
  it('should render cancel button', function () {
    render(<DocumentEditActionsFooter {...DEFAULT_PROPS} />);
    expect(screen.getByRole('button', { name: /cancel/i })).to.exist;
  });
  it('should render update button as disabled when there is a validation error', function () {
    render(
      <DocumentEditActionsFooter
        {...DEFAULT_PROPS}
        validationError={new Error('Invalid JSON')}
      />
    );
    expect(screen.getByRole('button', { name: /update/i })).to.have.attribute(
      'aria-disabled',
      'true'
    );
  });
  it('should call onCancel when cancel button is clicked', function () {
    const onCancelSpy = Sinon.spy();
    render(
      <DocumentEditActionsFooter {...DEFAULT_PROPS} onCancel={onCancelSpy} />
    );
    expect(onCancelSpy).to.not.have.been.called;
    userEvent.click(screen.getByRole('button', { name: /cancel/i }));
    expect(onCancelSpy).to.have.been.calledOnce;
  });
  it('should call onUpdate when update button is clicked and there is no validation error and is modified', function () {
    const onUpdateSpy = Sinon.spy();
    render(
      <DocumentEditActionsFooter
        {...DEFAULT_PROPS}
        onUpdate={onUpdateSpy}
        modified={true}
        validationError={null}
      />
    );
    expect(onUpdateSpy).to.not.have.been.called;
    userEvent.click(screen.getByRole('button', { name: /update/i }));
    expect(onUpdateSpy).to.have.been.calledOnce;
  });
});

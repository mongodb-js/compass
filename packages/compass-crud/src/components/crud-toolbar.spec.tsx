import React from 'react';
import { expect } from 'chai';
import sinon from 'sinon';
import AppRegistry from 'hadron-app-registry';
import {
  fireEvent,
  render,
  screen,
  cleanup,
  within,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import preferencesAccess from 'compass-preferences-model';
import { CrudToolbar } from './crud-toolbar';

const noop = () => {
  /* noop */
};
const queryBarText = 'Query bar';
const mockQueryBarRole = {
  name: 'Query Bar',
  // eslint-disable-next-line react/display-name
  component: () => <div>{queryBarText}</div>,
  configureStore: () => ({}),
  configureActions: () => {},
  storeName: 'Query.Store',
  actionName: 'Query.Actions',
};

const mockQueryBarStore = {
  state: {
    filterString: '',
    projectString: '',
    sortString: '',
    collationString: '',
    skipString: '',
    limitString: '',
    maxTimeMSString: '',
  },
};

const testOutdatedMessageId = 'crud-outdated-message-id';
const testErrorMessageId = 'document-list-error-summary';

function renderCrudToolbar(
  props?: Partial<React.ComponentProps<typeof CrudToolbar>>
) {
  const appRegistry = new AppRegistry();
  appRegistry.registerRole('Query.QueryBar', mockQueryBarRole);
  appRegistry.registerStore(mockQueryBarRole.storeName, mockQueryBarStore);

  return render(
    <CrudToolbar
      activeDocumentView="List"
      count={55}
      end={20}
      getPage={noop}
      insertDataHandler={noop}
      isExportable
      loadingCount={false}
      localAppRegistry={appRegistry}
      isWritable
      instanceDescription=""
      onApplyClicked={noop}
      onResetClicked={noop}
      onUpdateButtonClicked={noop}
      onDeleteButtonClicked={noop}
      openExportFileDialog={noop}
      outdated={false}
      page={0}
      readonly={false}
      refreshDocuments={noop}
      resultId="123"
      start={0}
      viewSwitchHandler={noop}
      queryLimit={0}
      querySkip={0}
      {...props}
    />
  );
}

const addDataText = 'Add Data';
const updateDataText = 'Update';
const deleteDataText = 'Delete';

describe('CrudToolbar Component', function () {
  let sandbox: sinon.SinonSandbox;

  afterEach(function () {
    cleanup();
    return sandbox.restore();
  });

  beforeEach(function () {
    sandbox = sinon.createSandbox();
    sandbox.stub(preferencesAccess, 'getPreferences').returns({
      enableBulkUpdateOperations: true,
      enableBulkDeleteOperations: true,
    } as any);
  });

  it('renders the query bar role', function () {
    renderCrudToolbar();

    expect(screen.getByText(queryBarText)).to.be.visible;
  });

  it('should not render the query bar role when isExportable is false', function () {
    renderCrudToolbar({
      isExportable: false,
    });

    expect(screen.queryByText(queryBarText)).to.not.exist;
  });

  it('call to change the document view type on click', function () {
    const viewSwitchHandlerSpy = sinon.spy();
    renderCrudToolbar({
      viewSwitchHandler: viewSwitchHandlerSpy,
    });

    expect(viewSwitchHandlerSpy.called).to.be.false;
    const option = within(screen.getByTestId('toolbar-view-table')).getByRole(
      'tab'
    );
    userEvent.click(option);

    expect(viewSwitchHandlerSpy.calledOnce).to.be.true;
    expect(viewSwitchHandlerSpy.firstCall.args[0]).to.equal('Table');
  });

  it('should call to get the next page when the next button is hit', function () {
    const getPageSpy = sinon.spy();
    renderCrudToolbar({
      getPage: getPageSpy,
    });

    expect(getPageSpy.called).to.be.false;
    fireEvent.click(screen.getByTestId('docs-toolbar-next-page-btn'));

    expect(getPageSpy.calledOnce).to.be.true;
    expect(getPageSpy.firstCall.args[0]).to.equal(1);
  });

  it('should have the prev page button disabled', function () {
    const getPageSpy = sinon.spy();
    renderCrudToolbar({
      getPage: getPageSpy,
    });

    expect(getPageSpy.called).to.be.false;
    fireEvent.click(screen.getByTestId('docs-toolbar-prev-page-btn'));

    expect(screen.getByTestId('docs-toolbar-prev-page-btn')).to.have.attribute(
      'aria-disabled',
      'true'
    );

    expect(getPageSpy.calledOnce).to.be.false;
    expect(screen.getByTestId('docs-toolbar-prev-page-btn')).to.be.visible;
  });

  it('should have the next page button disabled when on the first page without more than a page of documents', function () {
    const getPageSpy = sinon.spy();
    renderCrudToolbar({
      getPage: getPageSpy,
      count: 5,
      page: 0,
      start: 1,
      end: 5,
    });
    expect(getPageSpy.called).to.be.false;
    fireEvent.click(screen.getByTestId('docs-toolbar-next-page-btn'));

    expect(screen.getByTestId('docs-toolbar-next-page-btn')).to.have.attribute(
      'aria-disabled',
      'true'
    );

    expect(getPageSpy.calledOnce).to.be.false;
  });

  it('should call to get the next page when the prev button is hit on a non-first page', function () {
    const getPageSpy = sinon.spy();
    renderCrudToolbar({
      getPage: getPageSpy,
      page: 1,
      start: 20,
      end: 40,
    });
    expect(screen.getByTestId('docs-toolbar-prev-page-btn')).to.have.attribute(
      'aria-disabled',
      'false'
    );

    expect(getPageSpy.called).to.be.false;
    fireEvent.click(screen.getByTestId('docs-toolbar-prev-page-btn'));

    expect(getPageSpy.calledOnce).to.be.true;
    expect(getPageSpy.firstCall.args[0]).to.equal(0);
  });

  it('should have the next page button disabled when on the last page', function () {
    const getPageSpy = sinon.spy();
    renderCrudToolbar({
      getPage: getPageSpy,
      page: 1,
      start: 20,
      end: 39,
      count: 39,
    });

    expect(getPageSpy.called).to.be.false;
    fireEvent.click(screen.getByTestId('docs-toolbar-next-page-btn'));

    expect(screen.getByTestId('docs-toolbar-next-page-btn')).to.have.attribute(
      'aria-disabled',
      'true'
    );

    expect(getPageSpy.calledOnce).to.be.false;
  });

  it('should have the next page button enabled when count is unknown', function () {
    const getPageSpy = sinon.spy();
    renderCrudToolbar({
      getPage: getPageSpy,
      page: 2,
      count: undefined,
    });

    const nextButton = screen.getByTestId('docs-toolbar-next-page-btn');
    expect(nextButton).to.have.attribute('aria-disabled', 'false');

    expect(getPageSpy.called).to.be.false;
    fireEvent.click(nextButton);

    expect(getPageSpy.calledOnce).to.be.true;
    expect(getPageSpy.firstCall.args[0]).to.equal(3);
  });

  it('should render the add data button when it is not readonly', function () {
    renderCrudToolbar({
      readonly: false,
    });

    expect(
      screen.getByRole('button', {
        name: new RegExp(addDataText, 'i'),
      })
    ).to.be.visible;
  });

  it('should render the start and end count', function () {
    renderCrudToolbar({
      start: 5,
      end: 25,
      count: 200,
    });

    expect(screen.getByTestId('crud-document-count-display')).to.have.text(
      '5 – 25 of 200'
    );
  });

  it('should not render the add data, update and delete buttons when it is readonly', function () {
    renderCrudToolbar({
      readonly: true,
    });

    expect(screen.queryByText(addDataText)).to.not.exist;
    expect(screen.queryByText(updateDataText)).to.not.exist;
    expect(screen.queryByText(deleteDataText)).to.not.exist;
  });

  it('should call to open the export dialog when export is clicked', function () {
    const exportSpy = sinon.spy();
    renderCrudToolbar({
      openExportFileDialog: exportSpy,
    });

    expect(exportSpy.called).to.be.false;
    fireEvent.click(screen.getByText('Export Data'));
    fireEvent.click(screen.getByText('Export the full collection'));

    expect(exportSpy.calledOnce).to.be.true;
    expect(exportSpy.firstCall.args[0]).to.be.true;
  });

  describe('update button', function () {
    it('should not be visible when the enableBulkUpdateOperations toggle is off', function () {
      sandbox.restore();
      sandbox.stub(preferencesAccess, 'getPreferences').returns({
        enableBulkUpdateOperations: false,
      } as any);

      expect(screen.queryByText(updateDataText)).to.not.exist;
    });

    it('should render disabled when the query has a skip', function () {
      renderCrudToolbar({
        querySkip: 10,
      });

      expect(screen.getByText(updateDataText).closest('button')).to.have.attr(
        'disabled'
      );
    });

    it('should render disabled when the query has a limit', function () {
      renderCrudToolbar({
        queryLimit: 10,
      });

      expect(screen.getByText(updateDataText).closest('button')).to.have.attr(
        'disabled'
      );
    });

    it('should propagate click events', function () {
      const onUpdateButtonClickedSpy = sinon.spy();

      renderCrudToolbar({ onUpdateButtonClicked: onUpdateButtonClickedSpy });

      userEvent.click(screen.getByText(updateDataText).closest('button')!);
      expect(onUpdateButtonClickedSpy).to.have.been.called;
    });
  });

  describe('delete button', function () {
    it('should not be visible when the enableBulkDeleteOperations toggle is off', function () {
      sandbox.restore();
      sandbox.stub(preferencesAccess, 'getPreferences').returns({
        enableBulkDeleteOperations: false,
      } as any);

      expect(screen.queryByText(deleteDataText)).to.not.exist;
    });

    it('should render disabled when the query has a skip', function () {
      renderCrudToolbar({
        querySkip: 10,
      });

      expect(screen.getByText(deleteDataText).closest('button')).to.have.attr(
        'disabled'
      );
    });

    it('should render disabled when the query has a limit', function () {
      renderCrudToolbar({
        queryLimit: 10,
      });

      expect(screen.getByText(deleteDataText).closest('button')).to.have.attr(
        'disabled'
      );
    });

    it('should propagate click events', function () {
      const onDeleteButtonClickedSpy = sinon.spy();

      renderCrudToolbar({ onDeleteButtonClicked: onDeleteButtonClickedSpy });

      userEvent.click(screen.getByText(deleteDataText).closest('button')!);
      expect(onDeleteButtonClickedSpy).to.have.been.called;
    });
  });

  it('should not render the outdated message', function () {
    renderCrudToolbar();

    expect(screen.queryByTestId(testOutdatedMessageId)).to.not.exist;
  });

  describe('when the instance is in a writable state (`isWritable` is true)', function () {
    beforeEach(function () {
      renderCrudToolbar({
        isWritable: true,
      });
    });

    it('has the add data button enabled', function () {
      expect(
        screen
          .getByTestId('crud-add-data-show-actions')
          .getAttribute('disabled')
      ).to.equal(null);
    });
  });

  describe('when the instance is not in a writable state (`isWritable` is false)', function () {
    beforeEach(function () {
      renderCrudToolbar({
        isWritable: false,
      });
    });

    it('has the add data button disabled', function () {
      expect(
        screen
          .getByTestId('crud-add-data-show-actions')
          .getAttribute('disabled')
      ).to.exist;
    });
  });

  describe('when the documents are outdated', function () {
    beforeEach(function () {
      renderCrudToolbar({
        outdated: true,
      });
    });

    it('should render the outdated message', function () {
      expect(screen.getByTestId(testOutdatedMessageId)).to.be.visible;
    });

    it('should not render an error message', function () {
      expect(screen.queryByTestId(testErrorMessageId)).to.not.exist;
    });
  });

  describe('when there is an error', function () {
    beforeEach(function () {
      renderCrudToolbar({
        error: {
          name: 'test-error',
          message: 'pineapple 123',
        },
      });
    });

    it('should render the message', function () {
      expect(screen.getByTestId(testErrorMessageId)).to.be.visible;
      expect(screen.getByText('pineapple 123')).to.be.visible;
    });
  });

  describe('when there is an operation timed out error', function () {
    beforeEach(function () {
      renderCrudToolbar({
        error: {
          name: 'MongoServerError',
          message: 'pineapple',
          code: {
            value: 50,
          },
        },
      });
    });

    it('should render the message', function () {
      expect(screen.queryByText('pineapple')).to.not.exist;
      expect(
        screen.getByText(
          'Operation exceeded time limit. Please try increasing the maxTimeMS for the query in the expanded filter options.'
        )
      ).to.be.visible;
    });
  });
});

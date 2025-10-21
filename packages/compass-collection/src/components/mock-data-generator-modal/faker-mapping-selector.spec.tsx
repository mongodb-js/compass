import { expect } from 'chai';
import React from 'react';
import {
  screen,
  render,
  cleanup,
  waitFor,
  userEvent,
} from '@mongodb-js/testing-library-compass';
import sinon from 'sinon';
import FakerMappingSelector from './faker-mapping-selector';
import { UNRECOGNIZED_FAKER_METHOD } from '../../modules/collection-tab';
import { MONGO_TYPE_TO_FAKER_METHODS } from './constants';
import { MongoDBFieldTypeValues } from '@mongodb-js/compass-generative-ai';
import type { FakerArg } from './script-generation-utils';

const mockActiveJsonType = MongoDBFieldTypeValues.String;
const mockActiveFakerFunction = 'lorem.word';
const mockActiveFakerArgs: Array<FakerArg> = [];
const onJsonTypeSelectStub = sinon.stub();
const onFakerFunctionSelectStub = sinon.stub();

describe('FakerMappingSelector', () => {
  afterEach(() => {
    cleanup();
  });

  it('should display all MongoDB types in the dropdown', async () => {
    // Check that all MongoDB types from the constant are present
    const mongoTypes = Object.keys(MongoDBFieldTypeValues);

    render(
      <FakerMappingSelector
        activeJsonType={mockActiveJsonType}
        activeFakerFunction="lorem.word"
        activeFakerArgs={mockActiveFakerArgs}
        onJsonTypeSelect={onJsonTypeSelectStub}
        onFakerFunctionSelect={onFakerFunctionSelectStub}
      />
    );

    const jsonTypeSelect = screen.getByLabelText('JSON Type');
    userEvent.click(jsonTypeSelect);

    for (const type of mongoTypes) {
      await waitFor(() => {
        expect(screen.getByRole('option', { name: type })).to.exist;
      });
    }
  });

  describe('should display faker methods for each MongoDB type', () => {
    for (const [mongoType, methods] of Object.entries(
      MONGO_TYPE_TO_FAKER_METHODS
    )) {
      it(`should display faker methods for ${mongoType}`, () => {
        const firstMethod = methods[0];

        render(
          <FakerMappingSelector
            activeJsonType={
              mongoType as keyof typeof MONGO_TYPE_TO_FAKER_METHODS
            }
            activeFakerFunction={firstMethod}
            activeFakerArgs={mockActiveFakerArgs}
            onJsonTypeSelect={onJsonTypeSelectStub}
            onFakerFunctionSelect={onFakerFunctionSelectStub}
          />
        );

        const fakerFunctionSelect = screen.getByLabelText('Faker Function');
        userEvent.click(fakerFunctionSelect);

        methods.forEach((method) => {
          expect(screen.getByRole('option', { name: method })).to.exist;
        });
      });
    }
  });

  it('should call onJsonTypeSelect when MongoDB type changes', async () => {
    render(
      <FakerMappingSelector
        activeJsonType={mockActiveJsonType}
        activeFakerFunction={mockActiveFakerFunction}
        activeFakerArgs={mockActiveFakerArgs}
        onJsonTypeSelect={onJsonTypeSelectStub}
        onFakerFunctionSelect={onFakerFunctionSelectStub}
      />
    );

    const jsonTypeSelect = screen.getByLabelText('JSON Type');
    userEvent.click(jsonTypeSelect);

    const numberOption = await screen.findByRole('option', { name: 'Number' });
    userEvent.click(numberOption);

    expect(onJsonTypeSelectStub).to.have.been.calledOnceWith('Number');
  });

  it('should call onFakerFunctionSelect when faker function changes', async () => {
    render(
      <FakerMappingSelector
        activeJsonType={mockActiveJsonType}
        activeFakerFunction={mockActiveFakerFunction}
        activeFakerArgs={mockActiveFakerArgs}
        onJsonTypeSelect={onJsonTypeSelectStub}
        onFakerFunctionSelect={onFakerFunctionSelectStub}
      />
    );

    const fakerFunctionSelect = screen.getByLabelText('Faker Function');
    userEvent.click(fakerFunctionSelect);

    const emailOption = await screen.findByRole('option', {
      name: 'internet.email',
    });
    userEvent.click(emailOption);

    expect(onFakerFunctionSelectStub).to.have.been.calledOnceWith(
      'internet.email'
    );
  });

  it('should fire a track event when faker function changes', async () => {
    const newFakerMethod = 'internet.email';
    const result = render(
      <FakerMappingSelector
        activeJsonType={mockActiveJsonType}
        activeFakerFunction={mockActiveFakerFunction}
        activeFakerArgs={mockActiveFakerArgs}
        onJsonTypeSelect={onJsonTypeSelectStub}
        onFakerFunctionSelect={onFakerFunctionSelectStub}
      />
    );

    const fakerFunctionSelect = screen.getByLabelText('Faker Function');
    userEvent.click(fakerFunctionSelect);

    const emailOption = await screen.findByRole('option', {
      name: newFakerMethod,
    });
    userEvent.click(emailOption);

    await waitFor(() => {
      expect(result.track).to.have.been.calledWith(
        'Mock Data Faker Method Changed',
        {
          field_name: mockActiveJsonType,
          new_method: newFakerMethod,
        }
      );
    });
  });

  it('should show warning banner when faker method is unrecognized', () => {
    render(
      <FakerMappingSelector
        activeJsonType={mockActiveJsonType}
        activeFakerFunction={UNRECOGNIZED_FAKER_METHOD}
        activeFakerArgs={mockActiveFakerArgs}
        onJsonTypeSelect={onJsonTypeSelectStub}
        onFakerFunctionSelect={onFakerFunctionSelectStub}
      />
    );

    expect(
      screen.getByText(
        /Please select a function or we will default fill this field/
      )
    ).to.exist;
  });

  it('should not show warning banner when faker method is recognized', () => {
    render(
      <FakerMappingSelector
        activeJsonType={mockActiveJsonType}
        activeFakerFunction={mockActiveFakerFunction}
        activeFakerArgs={mockActiveFakerArgs}
        onJsonTypeSelect={onJsonTypeSelectStub}
        onFakerFunctionSelect={onFakerFunctionSelectStub}
      />
    );

    expect(
      screen.queryByText(
        /Please select a function or we will default fill this field/
      )
    ).to.not.exist;
  });
});

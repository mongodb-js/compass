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
import type { MongoDBFieldType } from '../../schema-analysis-types';
import {
  MONGO_TYPE_TO_FAKER_METHODS,
  MongoDBFieldTypeValues,
} from './constants';
import type { FakerArg } from './script-generation-utils';

const mockActiveJsonType: MongoDBFieldType = 'String';
const mockActiveFakerFunction = 'lorem.word';
const mockActiveFakerArgs: Array<FakerArg> = [];
const onJsonTypeSelectStub = sinon.stub();
const onFakerFunctionSelectStub = sinon.stub();

describe('FakerMappingSelector', () => {
  afterEach(() => {
    cleanup();
  });

  it('should display all MongoDB types in the dropdown', async () => {
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

    for (const type of MongoDBFieldTypeValues) {
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

  it('should always include the original LLM faker method in the dropdown', () => {
    const originalLlmMethod = 'custom.llmMethod';

    render(
      <FakerMappingSelector
        activeJsonType="String"
        activeFakerFunction="lorem.word"
        activeFakerArgs={[]}
        onJsonTypeSelect={onJsonTypeSelectStub}
        onFakerFunctionSelect={onFakerFunctionSelectStub}
        originalLlmFakerMethod={originalLlmMethod}
      />
    );

    const fakerFunctionSelect = screen.getByLabelText('Faker Function');
    userEvent.click(fakerFunctionSelect);

    // Should include the original LLM method even though it's not in MONGO_TYPE_TO_FAKER_METHODS
    expect(screen.getByRole('option', { name: originalLlmMethod })).to.exist;

    // Should also include standard methods for String type
    expect(screen.getByRole('option', { name: 'lorem.word' })).to.exist;
    expect(screen.getByRole('option', { name: 'lorem.sentence' })).to.exist;
  });

  it('should not duplicate the original LLM method if it is already in the standard methods', () => {
    const originalLlmMethod = 'lorem.word';

    render(
      <FakerMappingSelector
        activeJsonType="String"
        activeFakerFunction="lorem.sentence"
        activeFakerArgs={[]}
        onJsonTypeSelect={onJsonTypeSelectStub}
        onFakerFunctionSelect={onFakerFunctionSelectStub}
        originalLlmFakerMethod={originalLlmMethod}
      />
    );

    const fakerFunctionSelect = screen.getByLabelText('Faker Function');
    userEvent.click(fakerFunctionSelect);

    // Should only have one instance of 'lorem.word'
    const loremWordOptions = screen.getAllByRole('option', {
      name: 'lorem.word',
    });
    expect(loremWordOptions).to.have.length(1);
  });
});

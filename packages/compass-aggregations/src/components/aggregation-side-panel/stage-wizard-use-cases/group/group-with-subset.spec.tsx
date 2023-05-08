import React from 'react';
import { render, screen } from '@testing-library/react';
import { expect } from 'chai';
import {
  GroupWithSubset,
  mapGroupFormStateToStageValue,
  getValidationError,
} from './group-with-subset';
import sinon from 'sinon';
import {
  setMultiSelectComboboxValues,
  setSelectValue,
  setInputElementValue,
} from '../../../../../test/form-helper';
import type { GroupWithSubsetFormData } from './group-with-subset';
import type { StageWizardFields } from '..';

const SAMPLE_FIELDS: StageWizardFields = [
  {
    name: 'address',
    type: 'String',
  },
  {
    name: 'street',
    type: 'String',
  },
  {
    name: 'name',
    type: 'String',
  },
  {
    name: 'initials',
    type: 'String',
  },
  {
    name: 'orders',
    type: 'String',
  },
];

const FORM_DATA: GroupWithSubsetFormData = {
  accumulator: '',
  numberOfRecords: 0,
  groupFields: [],
  projectFields: [],
  sortFields: [],
  sortDirection: 'Asc',
};

describe('group with subset', function () {
  context('renders a group form', function () {
    beforeEach(function () {
      render(
        <GroupWithSubset
          serverVersion="5.2.0"
          fields={[]}
          onChange={() => {}}
        />
      );
    });

    it('renders labels', function () {
      expect(screen.getByText('Return the')).to.exist;
      expect(screen.getByText('from a group of')).to.exist;
    });

    it('renders accumulator type select', function () {
      expect(
        screen.getByRole('button', {
          name: /select accumulator/i,
        })
      ).to.exist;
    });

    it('renders number of records input', function () {
      expect(screen.getByLabelText(/number of records/i)).to.exist;
    });

    it('renders accumulator project fields combobox', function () {
      expect(
        screen.getByRole('textbox', {
          name: /select project field names/i,
        })
      ).to.exist;
    });

    it('renders group fields combobox', function () {
      expect(
        screen.getByRole('textbox', {
          name: /select group field names/i,
        })
      ).to.exist;
    });

    context('does not render number input for version 5', function () {
      beforeEach(function () {
        render(
          <GroupWithSubset
            serverVersion="5.0.0"
            fields={[]}
            onChange={() => {}}
          />
        );
      });
      it('renders number of records input', function () {
        expect(screen.getByLabelText(/number of records/i)).to.throw;
      });
    });

    context('sort form fields', function () {
      beforeEach(function () {
        setSelectValue(/select accumulator/i, 'Top');
      });
      it('renders sort fields combobox', function () {
        expect(
          screen.getByRole('textbox', {
            name: /select sort field names/i,
          })
        ).to.exist;
      });
      it('renders sort direction select', function () {
        expect(
          screen.getByRole('button', {
            name: /select direction/i,
          })
        ).to.exist;
      });
    });
  });

  context('calls onChange', function () {
    // Supports all the operators - $first(N), $last(N), $top(N) $bottom(N)
    context('server version > 5.2.0', function () {
      let onChange: sinon.SinonSpy;
      beforeEach(function () {
        onChange = sinon.spy();
        render(
          <GroupWithSubset
            serverVersion="5.2.0"
            onChange={onChange}
            fields={SAMPLE_FIELDS}
          />
        );
      });

      context('handles operators that do not require sort', function () {
        [
          {
            operator: '$first',
            nOperator: '$firstN',
          },
          {
            operator: '$last',
            nOperator: '$lastN',
          },
        ].forEach(({ operator, nOperator }) => {
          const accumulator = operator.replace(/^\$/, '');

          it(`${accumulator} with n = 1`, function () {
            setSelectValue(/select accumulator/i, accumulator);
            setMultiSelectComboboxValues(/select project field names/i, [
              'address',
              'street',
            ]);
            setMultiSelectComboboxValues(/select group field names/i, [
              'street',
            ]);
            setInputElementValue(/number of records/i, '1');
            expect(onChange.lastCall.args[0]).to.equal(
              JSON.stringify({
                _id: '$street',
                data: {
                  [operator]: {
                    address: '$address',
                    street: '$street',
                  },
                },
              })
            );
            expect(onChange.lastCall.args[1]).to.be.null;
          });

          it(`${accumulator} with n > 1`, function () {
            setSelectValue(/select accumulator/i, accumulator);
            setMultiSelectComboboxValues(/select project field names/i, [
              'address',
              'street',
            ]);
            setMultiSelectComboboxValues(/select group field names/i, [
              'street',
            ]);
            setInputElementValue(/number of records/i, '2');
            expect(onChange.lastCall.args[0]).to.equal(
              JSON.stringify({
                _id: '$street',
                data: {
                  [nOperator]: {
                    n: 2,
                    input: {
                      address: '$address',
                      street: '$street',
                    },
                  },
                },
              })
            );
            expect(onChange.lastCall.args[1]).to.be.null;
          });
        });
      });

      context('handles operators that require sort', function () {
        [
          {
            operator: '$top',
            nOperator: '$topN',
          },
          {
            operator: '$bottom',
            nOperator: '$bottomN',
          },
        ].forEach(({ operator, nOperator }) => {
          const accumulator = operator.replace(/^\$/, '');

          it(`${accumulator} with n = 1`, function () {
            setSelectValue(/select accumulator/i, accumulator);
            setMultiSelectComboboxValues(/select project field names/i, [
              'address',
              'street',
            ]);
            setMultiSelectComboboxValues(/select group field names/i, [
              'street',
            ]);
            setMultiSelectComboboxValues(/select sort field names/i, [
              'address',
            ]);

            setInputElementValue(/number of records/i, '1');
            expect(onChange.lastCall.args[0]).to.equal(
              JSON.stringify({
                _id: '$street',
                data: {
                  [operator]: {
                    output: {
                      address: '$address',
                      street: '$street',
                    },
                    sortBy: {
                      address: 1,
                    },
                  },
                },
              })
            );
            expect(onChange.lastCall.args[1]).to.be.null;
          });

          it(`${accumulator} with n > 1`, function () {
            setSelectValue(/select accumulator/i, accumulator);
            setMultiSelectComboboxValues(/select project field names/i, [
              'address',
              'street',
            ]);
            setMultiSelectComboboxValues(/select group field names/i, [
              'street',
            ]);
            setMultiSelectComboboxValues(/select sort field names/i, [
              'address',
            ]);

            setInputElementValue(/number of records/i, '2');
            expect(onChange.lastCall.args[0]).to.equal(
              JSON.stringify({
                _id: '$street',
                data: {
                  [nOperator]: {
                    n: 2,
                    output: {
                      address: '$address',
                      street: '$street',
                    },
                    sortBy: {
                      address: 1,
                    },
                  },
                },
              })
            );
            expect(onChange.lastCall.args[1]).to.be.null;
          });
        });
      });
    });

    // Supports only - $first and $last
    context('server version < 5.2.0', function () {
      let onChange: sinon.SinonSpy;
      beforeEach(function () {
        onChange = sinon.spy();
        render(
          <GroupWithSubset
            serverVersion="5.0.0"
            onChange={onChange}
            fields={SAMPLE_FIELDS}
          />
        );
      });
      ['$first', '$last'].forEach((accumulator) => {
        const name = accumulator.replace(/^\$/, '');
        it(accumulator, function () {
          setSelectValue(/select accumulator/i, name);
          setMultiSelectComboboxValues(/select project field names/i, [
            'street',
          ]);
          setMultiSelectComboboxValues(/select group field names/i, ['name']);
          expect(onChange.lastCall.args[0]).to.equal(
            JSON.stringify({
              _id: '$name',
              data: {
                [accumulator]: '$street',
              },
            })
          );
          expect(onChange.lastCall.args[1]).to.be.null;
        });
      });
    });
  });

  context('mapGroupFormStateToStageValue', function () {
    const FORM_DATA: GroupWithSubsetFormData = {
      accumulator: '',
      numberOfRecords: 0,
      groupFields: [],
      projectFields: [],
      sortFields: [],
      sortDirection: 'Asc',
    };

    it('returns empty object when accumulator is not selected', function () {
      expect(mapGroupFormStateToStageValue({} as any)).to.deep.equal({});
    });

    context('when n = 1', function () {
      it('maps $first', function () {
        expect(
          mapGroupFormStateToStageValue({
            ...FORM_DATA,
            accumulator: '$first',
            numberOfRecords: 1,
            projectFields: ['data'],
          })
        ).to.deep.equal({
          _id: null,
          data: {
            $first: '$data',
          },
        });
      });

      it('maps $last', function () {
        expect(
          mapGroupFormStateToStageValue({
            ...FORM_DATA,
            accumulator: '$last',
            groupFields: ['address.country'],
            numberOfRecords: 1,
            projectFields: ['user', 'address'],
          })
        ).to.deep.equal({
          _id: '$address.country',
          data: {
            $last: {
              user: '$user',
              address: '$address',
            },
          },
        });
      });

      it('maps $top', function () {
        expect(
          mapGroupFormStateToStageValue({
            ...FORM_DATA,
            accumulator: '$top',
            numberOfRecords: 1,
            projectFields: ['data'],
          })
        ).to.deep.equal({
          _id: null,
          data: {
            $top: {
              output: '$data',
              sortBy: {},
            },
          },
        });
      });

      it('maps $bottom', function () {
        expect(
          mapGroupFormStateToStageValue({
            ...FORM_DATA,
            accumulator: '$bottom',
            groupFields: ['address.zip', 'address.state'],
            numberOfRecords: 1,
            projectFields: ['name', 'address'],
            sortFields: ['address.country'],
            sortDirection: 'Asc',
          })
        ).to.deep.equal({
          _id: {
            address_zip: '$address.zip',
            address_state: '$address.state',
          },
          data: {
            $bottom: {
              output: {
                name: '$name',
                address: '$address',
              },
              sortBy: {
                'address.country': 1,
              },
            },
          },
        });
      });
    });

    context('when n > 1', function () {
      it('maps $first to $firstN', function () {
        expect(
          mapGroupFormStateToStageValue({
            ...FORM_DATA,
            accumulator: '$first',
            numberOfRecords: 5,
            projectFields: ['data'],
          })
        ).to.deep.equal({
          _id: null,
          data: {
            $firstN: {
              input: '$data',
              n: 5,
            },
          },
        });
      });

      it('maps $last to $lastN', function () {
        expect(
          mapGroupFormStateToStageValue({
            ...FORM_DATA,
            accumulator: '$last',
            groupFields: ['address.country'],
            numberOfRecords: 5,
            projectFields: ['user', 'address'],
          })
        ).to.deep.equal({
          _id: '$address.country',
          data: {
            $lastN: {
              input: {
                user: '$user',
                address: '$address',
              },
              n: 5,
            },
          },
        });
      });

      it('maps $top to $topN', function () {
        expect(
          mapGroupFormStateToStageValue({
            ...FORM_DATA,
            accumulator: '$top',
            numberOfRecords: 5,
            projectFields: ['data'],
          })
        ).to.deep.equal({
          _id: null,
          data: {
            $topN: {
              output: '$data',
              n: 5,
              sortBy: {},
            },
          },
        });
      });

      it('maps $bottom to $bottomN', function () {
        expect(
          mapGroupFormStateToStageValue({
            ...FORM_DATA,
            accumulator: '$bottom',
            numberOfRecords: 5,
            projectFields: ['name', 'address'],
            sortFields: ['address.country'],
            sortDirection: 'Asc',
          })
        ).to.deep.equal({
          _id: null,
          data: {
            $bottomN: {
              output: {
                name: '$name',
                address: '$address',
              },
              n: 5,
              sortBy: {
                'address.country': 1,
              },
            },
          },
        });
      });
    });
  });

  context('getValidationError', function () {
    it('errors when there is no accumulator', function () {
      expect(getValidationError({} as any)?.message).to.equal(
        'Accumulator is required.'
      );
    });

    it('validates accumulator', function () {
      expect(
        getValidationError({
          ...FORM_DATA,
          accumulator: '',
        })?.message
      ).to.equal('Accumulator is required.');
    });

    it('validates number of records', function () {
      expect(
        getValidationError({
          ...FORM_DATA,
          accumulator: '$first',
          numberOfRecords: 0,
        })?.message
      ).to.equal('Number of records is not valid.');
      expect(
        getValidationError({
          ...FORM_DATA,
          accumulator: '$first',
          numberOfRecords: -1,
        })?.message
      ).to.equal('Number of records is not valid.');
    });

    it('validates project fields', function () {
      expect(
        getValidationError({
          ...FORM_DATA,
          accumulator: '$first',
          numberOfRecords: 2,
          projectFields: [],
        })?.message
      ).to.equal('Accumulator fields are required.');
    });

    context('validates sort fields', function () {
      it('for $top', function () {
        expect(
          getValidationError({
            ...FORM_DATA,
            accumulator: '$top',
            numberOfRecords: 2,
            projectFields: ['name'],
            sortFields: [],
          })?.message
        ).to.equal('Sort fields are required.');
      });

      it('for $bottom', function () {
        expect(
          getValidationError({
            ...FORM_DATA,
            accumulator: '$bottom',
            numberOfRecords: 2,
            projectFields: ['name'],
            sortFields: [],
          })?.message
        ).to.equal('Sort fields are required.');
      });
    });

    context('validates and return null when input is valid', function () {
      it('for $first', function () {
        expect(
          getValidationError({
            ...FORM_DATA,
            accumulator: '$first',
            numberOfRecords: 2,
            projectFields: ['user'],
          })
        ).to.be.null;
      });

      it('for $last', function () {
        expect(
          getValidationError({
            ...FORM_DATA,
            accumulator: '$last',
            numberOfRecords: 2,
            projectFields: ['user'],
          })
        ).to.be.null;
      });

      it('for $top', function () {
        expect(
          getValidationError({
            ...FORM_DATA,
            accumulator: '$top',
            numberOfRecords: 2,
            projectFields: ['user'],
            sortFields: ['address'],
            sortDirection: 'Asc',
          })
        ).to.be.null;
      });

      it('for $bottom', function () {
        expect(
          getValidationError({
            ...FORM_DATA,
            accumulator: '$bottom',
            numberOfRecords: 2,
            projectFields: ['user'],
            sortFields: ['address'],
            sortDirection: 'Asc',
          })
        ).to.be.null;
      });
    });
  });
});

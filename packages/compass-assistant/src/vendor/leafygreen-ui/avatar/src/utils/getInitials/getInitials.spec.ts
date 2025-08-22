import { getInitials } from './getInitials';

const TestInitialCases: Array<{
  description: string;
  givenName: string;
  surname: string;
  initials: string | null;
  givenInitial: string | null;
  surnameInitial: string | null;
}> = [
  {
    description: 'Traditional Latin name',
    givenName: 'Adam',
    surname: 'Thompson',
    initials: 'AT',
    givenInitial: 'A',
    surnameInitial: 'T',
  },
  {
    description: 'Hyphenated Latin last name',
    givenName: 'Olivia',
    surname: 'Newton-John',
    initials: 'ON',
    givenInitial: 'O',
    surnameInitial: 'N',
  },
  {
    description: 'Hyphenated Latin first name',
    givenName: 'Jean-Jacques',
    surname: 'Rousseau',
    initials: 'JR',
    givenInitial: 'J',
    surnameInitial: 'R',
  },
  {
    description: 'Prefixed Latin name (Mac)',
    givenName: 'Ronald',
    surname: 'MacDonald',
    initials: 'RM',
    givenInitial: 'R',
    surnameInitial: 'M',
  },
  {
    description: "Prefixed Latin name (O')",
    givenName: 'Catherine',
    surname: "O'Hara",
    initials: 'CO',
    givenInitial: 'C',
    surnameInitial: 'O',
  },
  {
    description: 'Prefixed Latin name (van)',
    givenName: 'Vincent',
    surname: 'van Gogh',
    initials: 'VG',
    givenInitial: 'V',
    surnameInitial: 'G',
  },
  {
    description: 'Prefixed Latin name (de la)',
    givenName: 'Nicolás',
    surname: 'de la Cruz',
    initials: 'NC',
    givenInitial: 'N',
    surnameInitial: 'C',
  },
  {
    description: 'Multiple given names',
    givenName: 'Pierre Elliot',
    surname: 'Trudeau',
    initials: 'PET',
    givenInitial: 'PE',
    surnameInitial: 'T',
  },
  {
    description: 'Multiple surnames',
    givenName: 'Sacha',
    surname: 'Baron Cohen',
    initials: 'SBC',
    givenInitial: 'S',
    surnameInitial: 'BC',
  },
  {
    description: 'Hebrew name (not supported)',
    givenName: 'אדמה',
    surname: 'בר אבא',
    initials: null,
    givenInitial: null,
    surnameInitial: null,
  },
  {
    description: 'Japanese name (not supported)',
    givenName: 'アダモ',
    surname: 'トムソン',
    initials: null,
    givenInitial: null,
    surnameInitial: null,
  },
  // Notably missing Suffixes (e.g. Jr., Sr., III, etc.)
];

describe('packages/avatar/utils/getInitials', () => {
  describe.each(TestInitialCases)(
    '$description ($givenName $surname => $initials)',
    ({ givenName, surname, initials, givenInitial, surnameInitial }) => {
      describe(`As 1 argument`, () => {
        const fullName = `${givenName} ${surname}`;
        const calculated = getInitials(fullName);
        test('full initials', () => {
          expect(calculated?.initials).toEqual(initials);
        });
      });

      describe(`As 2 arguments`, () => {
        const calculated = getInitials(givenName, surname);
        test('full initials', () => {
          expect(calculated?.initials).toEqual(initials);
        });
        test('given initial', () => {
          expect(calculated?.givenInitial).toEqual(givenInitial);
        });
        test('surname initials', () => {
          expect(calculated?.surnameInitial).toEqual(surnameInitial);
        });
      });
    }
  );
});

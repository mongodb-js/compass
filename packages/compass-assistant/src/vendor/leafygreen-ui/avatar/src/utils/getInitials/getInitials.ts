import { supportedLatinRegex } from './latinRegex';

interface Initials {
  initials: string | null;
  givenInitial: string | null;
  surnameInitial: string | null;
}

const nullResult = {
  initials: null,
  givenInitial: null,
  surnameInitial: null,
};

/**
 * Returns the initials of the provided name(s)
 *
 * If only a single argument is provided,
 * this string will be assumed to be the full name.
 *
 * Names including characters other than the English alphabet,
 * and common European accented letters will be ignored,
 * and will return `null`.
 *
 * **Known issue**: Names with suffixes (e.g. Jr., Sr., etc.)
 * will include the first letter of the suffix in the surname initial
 */
export const getInitials = (
  fullOrGivenName?: string,
  surname?: string
): Initials => {
  if (
    (!fullOrGivenName && !!surname) || // no args provided
    (fullOrGivenName && !supportedLatinRegex.test(fullOrGivenName)) || // arg0 is non-latin
    (surname && !supportedLatinRegex.test(surname)) // arg1 is non-latin
  ) {
    return nullResult;
  }

  let givenInitial: string | null = null;
  let surnameInitial: string | null = null;

  if (surname) {
    const givenName = fullOrGivenName;
    givenInitial = givenName ? getSimpleInitials(givenName) : null;
    surnameInitial = getSimpleInitials(surname);
    const initials = `${givenInitial || ''}${surnameInitial || ''}`;

    return {
      initials,
      givenInitial,
      surnameInitial,
    };
  } else {
    if (!fullOrGivenName) {
      return nullResult;
    }

    const fullNameSegments = fullOrGivenName.split(' ');

    const givenName = fullNameSegments[0];
    givenInitial = getSimpleInitials(givenName);
    surnameInitial = getSimpleInitials(fullNameSegments.slice(1).join(' '));
  }

  const initials = `${givenInitial || ''}${surnameInitial || ''}`;

  return {
    initials,
    givenInitial,
    surnameInitial,
  };
};

/**
 * Returns the first character of every word in the provided string
 * that begins with an upper-case letter
 *
 * e.g.
 * Adam Thompson => AT
 * Vincent van Gogh => VG
 */
const getSimpleInitials = (str: string): string => {
  return str
    .split(' ')
    .map((n) => n[0])
    .filter(isUpperCase)
    .join('');
};

const isUpperCase = (str: string): boolean => {
  if (!str || str.length !== 1) return false;

  return str.toUpperCase() === str;
};

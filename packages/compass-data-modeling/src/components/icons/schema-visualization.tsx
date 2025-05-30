import React, { useMemo } from 'react';
import { palette, useDarkMode } from '@mongodb-js/compass-components';

const SchemaVisualization: React.FunctionComponent = () => {
  const darkMode = useDarkMode();
  const strokeColor = useMemo(
    () => (darkMode ? palette.white : palette.black),
    [darkMode]
  );
  // Using green that doesn't change with dark mode
  const fillColor = palette.green.base;

  return (
    <svg
      width="72"
      height="72"
      viewBox="0 0 72 72"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <g id="Technical_MDB_SchemaVisualization">
        <g id="mdb_schema_visualization">
          <path
            id="Vector"
            d="M18.0203 46V35C18.0203 32.8 19.8229 31 22.0261 31H50.0666C52.2698 31 54.0724 32.8 54.0724 35V46M36.0463 36V46"
            stroke={strokeColor}
            strokeMiterlimit="10"
            strokeLinejoin="round"
          />
          <path
            id="Vector_2"
            d="M66.0896 62H6.00289C4.9013 62 4 61.1 4 60V12C4 10.9 4.9013 10 6.00289 10H65.9895C67.0911 10 67.9924 10.9 67.9924 12V59.9C68.0925 61.1 67.1912 62 66.0896 62Z"
            stroke={strokeColor}
            strokeMiterlimit="10"
            strokeLinejoin="round"
          />
          <path
            id="Vector_3"
            d="M68 20H4V12.1C4 10.9 4.9 10 6.1 10H65.9C67.1 10 68 10.9 68 12.1V20Z"
            fill={fillColor}
            stroke={strokeColor}
            strokeMiterlimit="10"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            id="Vector_4"
            d="M40 56H32C31.4 56 31 55.6 31 55V47C31 46.4 31.4 46 32 46H40C40.6 46 41 46.4 41 47V55C41 55.6 40.6 56 40 56Z"
            fill={fillColor}
            stroke={strokeColor}
            strokeMiterlimit="10"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            id="Vector_5"
            d="M58 56H50C49.4 56 49 55.6 49 55V47C49 46.4 49.4 46 50 46H58C58.6 46 59 46.4 59 47V55C59 55.6 58.5 56 58 56Z"
            fill={fillColor}
            stroke={strokeColor}
            strokeMiterlimit="10"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            id="Vector_6"
            d="M22 56H14C13.4 56 13 55.6 13 55V47C13 46.4 13.4 46 14 46H22C22.6 46 23 46.4 23 47V55C23 55.6 22.6 56 22 56Z"
            fill={fillColor}
            stroke={strokeColor}
            strokeMiterlimit="10"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            id="Vector_7"
            d="M40 36H32C31.4 36 31 35.6 31 35V27C31 26.4 31.4 26 32 26H40C40.6 26 41 26.4 41 27V35C41 35.6 40.6 36 40 36Z"
            fill={fillColor}
            stroke={strokeColor}
            strokeMiterlimit="10"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>
      </g>
    </svg>
  );
};

export default SchemaVisualization;

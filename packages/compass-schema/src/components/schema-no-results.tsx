import React from 'react';
import { Body, css, spacing, uiColors } from '@mongodb-js/compass-components';

const emptyContainerStyles = css({
  padding: spacing[7],
  fill: 'none',
  stroke: uiColors.gray.base,
  textAlign: 'center',
});

const emptyTextStyles = css({
  fontSize: '16px',
});

const SchemaNoResults: React.FunctionComponent = () => {
  return (
    <div className={emptyContainerStyles}>
      <div>
        <svg
          width="44"
          height="60"
          viewBox="0 0 44 60"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M21.9297 38.2988C23.4783 35.1247 27.7679 30.0989 32.5375 35.3879" />
          <path d="M1 10.7831V51.3133L9.61538 59M1 10.7831L35.4615 1L43 5.19277M1 10.7831L10.1538 15.6747M9.61538 59L43 45.7229C39.9487 34.0763 38 22.5957 43 5.19277M9.61538 59C5.5 34.9362 7.46154 20.3333 10.1538 15.6747M43 5.19277L10.1538 15.6747" />
          <path
            d="M19.7174 26.7113C19.7734 27.324 19.6719 27.8684 19.4884 28.2491C19.2999 28.6402 19.0726 28.7786 18.9038 28.7941C18.7349 28.8095 18.4862 28.7146 18.2299 28.3642C17.9804 28.0232 17.7818 27.5063 17.7257 26.8935C17.6696 26.2808 17.7711 25.7364 17.9546 25.3557C18.1432 24.9646 18.3704 24.8262 18.5393 24.8107C18.7082 24.7953 18.9568 24.8902 19.2132 25.2406C19.4627 25.5816 19.6613 26.0985 19.7174 26.7113Z"
            fill="#89979B"
          />
          <path
            d="M32.481 23.5351C32.5371 24.1479 32.4356 24.6923 32.2521 25.0729C32.0636 25.464 31.8363 25.6025 31.6674 25.6179C31.4985 25.6334 31.2499 25.5385 30.9935 25.1881C30.744 24.847 30.5454 24.3301 30.4894 23.7174C30.4333 23.1046 30.5348 22.5602 30.7183 22.1796C30.9068 21.7885 31.1341 21.65 31.303 21.6346C31.4719 21.6191 31.7205 21.714 31.9769 22.0644C32.2264 22.4055 32.425 22.9224 32.481 23.5351Z"
            fill="#89979B"
          />
        </svg>
      </div>
      <div>
        <Body data-testid="schema-fields-empty" className={emptyTextStyles}>
          No documents found
        </Body>
      </div>
    </div>
  );
};

export { SchemaNoResults };

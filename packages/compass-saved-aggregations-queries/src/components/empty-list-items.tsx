import React from 'react';
import {
  EmptyContent,
  Link,
  NoSavedItemsIcon,
} from '@mongodb-js/compass-components';

const SearchResultsIcon = () => {
  return (
    <svg
      width="72"
      height="72"
      viewBox="0 0 72 72"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M43.875 43.875L64 64M50 29C50 40.598 40.598 50 29 50C17.402 50 8 40.598 8 29C8 17.402 17.402 8 29 8C40.598 8 50 17.402 50 29Z"
        stroke="#001e2b"
      />
      <path
        d="M22 43C22 45.1132 22.2625 47.1879 22.875 49.125C24.8 49.7413 26.9 50 29 50C40.6375 50 50 40.7107 50 29C50 26.8868 49.7375 24.8121 49.125 22.875C47.2 22.2586 45.1 22 43 22C31.3625 22 22 31.2893 22 43Z"
        fill="#00ed64"
        stroke="#001e2b"
        strokeMiterlimit="10"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export const NoSavedItems: React.FunctionComponent = () => {
  return (
    <EmptyContent
      icon={NoSavedItemsIcon}
      title="No saved queries yet."
      subTitle="Start saving your aggregations and find queries, you'll see them here."
      callToAction={
        <div>
          Not sure where to start? &nbsp;
          <Link
            hideExternalIcon
            href="https://docs.mongodb.com/compass/current/query/queries/"
          >
            Visit our Docs &#8594;
          </Link>
        </div>
      }
    />
  );
};

export const NoSearchResults: React.FunctionComponent = () => {
  return (
    <EmptyContent
      icon={SearchResultsIcon}
      title="No results found."
      subTitle="We can't find any item matching your search."
    />
  );
};

import React from 'react';
import {
  css,
  spacing,
  Body,
  uiColors,
  Link,
  Subtitle,
} from '@mongodb-js/compass-components';

const QuerySearchIcon = () => {
  return (
    <svg
      width="72"
      height="72"
      viewBox="0 0 72 72"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M47 53C54.1797 53 60 47.1797 60 40C60 32.8203 54.1797 27 47 27C39.8203 27 34 32.8203 34 40C34 47.1797 39.8203 53 47 53Z"
        fill="#00ed64"
        stroke="#001e2b"
        strokeMiterlimit="10"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M56 49L68 61" stroke="#001e2b" />
      <path
        d="M4 35.9501H6.2M6.2 35.9501C9.4 35.9501 12.1 33.3553 12.1 30.0619V19.5828C12.1 14.8922 15.9 11 20.7 11M6.2 35.9501C9.4 35.9501 12.1 38.5449 12.1 41.8383V52.4172C12.1 57.1078 15.9 61 20.7 61M54.0001 35.9501H51.8001M51.8001 35.9501C48.6001 35.9501 45.9001 38.5449 45.9001 41.8383V52.4172C45.9001 57.1078 42.1001 61 37.3001 61M51.8001 35.9501C48.6001 35.9501 45.9 33.3553 45.9 30.0619V19.5828C45.9 14.8922 42.1 11 37.3 11"
        stroke="#001e2b"
        strokeMiterlimit="10"
      />
    </svg>
  );
};
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

const containerStyles = css({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  textAlign: 'center',
  marginLeft: spacing[3],
  marginRight: spacing[3],
  marginTop: spacing[7],
});

const iconStyles = css({
  flex: 'none',
  maxWidth: '80px',
  maxHeight: '80px',
});
const titleStyles = css({
  color: uiColors.green.dark2,
});
const subTitleStyles = css({
  marginTop: spacing[2],
  maxWidth: '600px',
});
const callToActionStyles = css({
  marginTop: spacing[5],
  maxWidth: '600px',
});

type EmptyContentProps = {
  icon: React.FunctionComponent;
  title: string;
  subTitle?: string;
  callToAction?: string | JSX.Element;
};

const EmptyContent: React.FunctionComponent<
  EmptyContentProps & React.HTMLProps<HTMLDivElement>
> = ({ icon: Icon, title, subTitle, callToAction }) => {
  return (
    <div className={containerStyles}>
      <div className={iconStyles}>
        <Icon />
      </div>
      <Subtitle className={titleStyles}>{title}</Subtitle>
      <Body className={subTitleStyles}>{subTitle}</Body>
      <Body className={callToActionStyles}>{callToAction}</Body>
    </div>
  );
};

export const NoSavedItems: React.FunctionComponent = () => {
  return (
    <EmptyContent
      icon={QuerySearchIcon}
      title={'No saved queries yet.'}
      subTitle={
        "Start saving your aggregations and find queries, you'll see them here."
      }
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
      title={'No results found.'}
      subTitle={'We can’t find any item matching your search.'}
    />
  );
};

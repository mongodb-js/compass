# hadron-react-buttons [![][npm_img]][npm_url]

> Hadron React Button Components

### Usage

```javascript
const { IconButton, TextButton } = require('hadron-react-buttons');

const icon = (
  <IconButton
    title="title"
    clickHandler={click}
    className="class-name"
    iconClassName="icon-class-name"
    dataTestId="icon-button-test" />
);

const text = (
  <TextButton
    text="title"
    clickHandler={click}
    className="class-name"
    dataTestId="text-button-test" />
);

```

[npm_img]: https://img.shields.io/npm/v/hadron-react-buttons.svg?style=flat-square
[npm_url]: https://www.npmjs.org/package/hadron-react-buttons

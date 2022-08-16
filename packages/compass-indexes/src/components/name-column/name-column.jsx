import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import {
  spacing,
  css,
  IndexIcon,
  BadgeVariant,
  Badge,
  Accordion,
} from '@mongodb-js/compass-components';

const keyListStyles = css({
  marginTop: spacing[1],
  marginBottom: spacing[1],
});

const keyItemStyles = css({
  paddingTop: spacing[1],
  paddingLeft: spacing[4],
});

class NameColumn extends PureComponent {
  static displayName = 'NameColumn';

  static propTypes = {
    index: PropTypes.object.isRequired,
  };

  render() {
    const indexName = this.props.index.name;
    const indexKeys = this.props.index.fields.serialize();
    return (
      <td>
        <Accordion
          text={indexName}
          data-testid="index-field-name"
          aria-label={`Show/Hide index ${indexName} keys`}
        >
          <ul className={keyListStyles}>
            {indexKeys.map(({ field, value }) => (
              <li key={field} className={keyItemStyles}>
                <Badge
                  data-testid={`${field}-key`}
                  variant={BadgeVariant.LightGray}
                >
                  {field}
                  &nbsp;
                  <IndexIcon direction={value} />
                </Badge>
              </li>
            ))}
          </ul>
        </Accordion>
      </td>
    );
  }
}

export default NameColumn;

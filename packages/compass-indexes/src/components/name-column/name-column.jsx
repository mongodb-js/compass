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

const containerStyles = css({
  paddingLeft: spacing[4],
  paddingBottom: spacing[3],
});

const indexKeyStyles = css({
  marginTop: spacing[1],
  marginBottom: spacing[1],
  display: 'flex',
  gap: spacing[1],
  flexDirection: 'column',
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
      <td className={containerStyles}>
        <Accordion
          text={indexName}
          data-testid="index-field-name"
          aria-label={`${indexName}-index`}
        >
          <div className={indexKeyStyles}>
            {indexKeys.map(({ field, value }) => (
              <Badge
                data-testid={`${field}-key`}
                variant={BadgeVariant.LightGray}
                key={field}
              >
                {field}
                &nbsp;
                <IndexIcon direction={value} />
              </Badge>
            ))}
          </div>
        </Accordion>
      </td>
    );
  }
}

export default NameColumn;

import React, { ChangeEvent, useState, useCallback } from 'react';
import { css } from '@emotion/css';

import { RadioBox, RadioBoxGroup, spacing } from '@mongodb-js/compass-components';

import Identity from './identity';
import None from './none';
import Password from './password';
import Socks from './socks';

interface TabOption {
  id: string;
  title: string;
  component: React.FC;
}

const options: TabOption[] = [
  {
    title: 'None',
    id: 'none',
    component: None,
  },
  {
    title: 'Use Password',
    id: 'password',
    component: Password,
  },
  {
    title: 'Use Identity File',
    id: 'identity',
    component: Identity,
  },
  {
    title: 'Socks5',
    id: 'socks',
    component: Socks,
  },
];

const containerStyles = css({
  marginTop: spacing[4]
});

function SSHTunnel(): React.ReactElement {
  const [selectedOption, setSelectedOption] = useState(options[0]);

  const optionSelected = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    event.preventDefault();
    const item = options.find(({id}) => id === event.target.value);
    if (item) {
      setSelectedOption(item);
    }
  }, []);

  const SSLOptionContent = selectedOption.component;

  return (
    <div className={containerStyles}>
      <RadioBoxGroup onChange={optionSelected} className="radio-box-group-style">
        {options.map(({title, id}) => {
          return (
            <RadioBox checked={selectedOption.id === id} value={id} key={id}>{title}</RadioBox>
          );
        })}
      </RadioBoxGroup>
      <SSLOptionContent />
    </div>
  );
}

export default SSHTunnel;

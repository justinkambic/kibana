/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React, { ChangeEvent, useState } from 'react';
import { EuiButton, EuiFieldSearch, EuiFlexGroup, EuiFlexItem } from '@elastic/eui';
import styled from 'styled-components';
import useDebounce from 'react-use/lib/useDebounce';
import { TLS_SETTINGS_ROUTE } from '../../../../../common/constants';
import { SEARCH_CERTS } from './translations';

const WrapFieldSearch = styled('div')`
  max-width: 700px;
`;

interface Props {
  setSearch: (val: string) => void;
}

export const CertificateSearch: React.FC<Props> = ({ setSearch }) => {
  const [debouncedValue, setDebouncedValue] = useState('');

  const onChange = (e: ChangeEvent<HTMLInputElement>) => {
    setDebouncedValue(e.target.value);
  };

  useDebounce(
    () => {
      setSearch(debouncedValue);
    },
    350,
    [debouncedValue]
  );

  return (
    <EuiFlexGroup justifyContent="spaceBetween">
      <EuiFlexItem>
        <WrapFieldSearch>
          <EuiFieldSearch
            data-test-subj="uptimeCertSearch"
            placeholder={SEARCH_CERTS}
            onChange={onChange}
            isClearable={true}
            aria-label={SEARCH_CERTS}
            fullWidth={true}
          />
        </WrapFieldSearch>
      </EuiFlexItem>
      <EuiFlexItem grow={false}>
        <EuiButton href={TLS_SETTINGS_ROUTE} data-test-subj="xpack.synthetics.tls.settingsButton">
          Settings
        </EuiButton>
      </EuiFlexItem>
    </EuiFlexGroup>
  );
};

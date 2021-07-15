/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React, { useState } from 'react';
import { EuiFilterGroup } from '@elastic/eui';
import styled from 'styled-components';
import { useRouteMatch } from 'react-router-dom';
import { filterLabels } from './translations';
import { useFilterUpdate } from '../../../hooks/use_filter_update';
import { MONITOR_ROUTE } from '../../../../common/constants';
import { useSelectedFilters } from '../../../hooks/use_selected_filters';
import { FieldValueSuggestions } from '../../../../../observability/public';
import { SelectedFilters } from './selected_filters';
import { useIndexPattern } from '../../../contexts/uptime_index_pattern_context';
import { useGetUrlParams } from '../../../hooks';

const Container = styled(EuiFilterGroup)`
  margin-bottom: 10px;
`;

export const FilterGroup = () => {
  const [updatedFieldValues, setUpdatedFieldValues] = useState<{
    fieldName: string;
    values?: string[];
  }>({ fieldName: '', values: [] });

  useFilterUpdate(updatedFieldValues.fieldName, updatedFieldValues.values);

  const { dateRangeStart, dateRangeEnd } = useGetUrlParams();

  const { filtersList } = useSelectedFilters();

  const indexPattern = useIndexPattern();

  const [isOpen, setIsOpen] = useState('');

  const onFilterFieldChange = (fieldName: string, values?: string[]) => {
    setUpdatedFieldValues({ fieldName, values });
    setIsOpen('');
  };

  return (
    <>
      <Container>
        {indexPattern &&
          filtersList.map(({ fieldName, label, selectedItems }) => (
            <FieldValueSuggestions
              key={fieldName}
              compressed={false}
              indexPatternTitle={indexPattern.title}
              sourceField={fieldName}
              label={label}
              selectedValue={selectedItems}
              onChange={(values) => onFilterFieldChange(fieldName, values)}
              asCombobox={false}
              asFilterButton={true}
              forceOpen={isOpen === fieldName}
              setForceOpen={() => {
                setIsOpen('');
              }}
              filters={[]}
              isSyntheticsData={true}
              time={{ from: dateRangeStart, to: dateRangeEnd }}
            />
          ))}
      </Container>
      <SelectedFilters onChange={onFilterFieldChange} />
    </>
  );
};

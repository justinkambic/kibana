/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

// SPIKE: minimal sort-selector UI — not production-quality.
// The real implementation will be designed with EUI team input per #272186.

import React, { useCallback } from 'react';
import { EuiSelect } from '@elastic/eui';
import { i18n } from '@kbn/i18n';
import type { MetricsSortDirection, MetricsSortType } from '../../restorable_state';

interface SortSelectorProps {
  sortType: MetricsSortType;
  sortDirection: MetricsSortDirection;
  onSortTypeChange: (value: MetricsSortType) => void;
  onSortDirectionChange: (value: MetricsSortDirection) => void;
  hasRelevanceData: boolean;
}

// Encode both type + direction into a single select value for simplicity.
type SortOption = 'alphabetical-asc' | 'alphabetical-desc' | 'relevance-desc';

export const SortSelector = ({
  sortType,
  sortDirection,
  onSortTypeChange,
  onSortDirectionChange,
  hasRelevanceData,
}: SortSelectorProps) => {
  const currentValue: SortOption =
    sortType === 'relevance' ? 'relevance-desc' : `alphabetical-${sortDirection}`;

  const onChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const value = e.target.value as SortOption;
      if (value === 'relevance-desc') {
        onSortTypeChange('relevance');
        onSortDirectionChange('desc');
      } else if (value === 'alphabetical-asc') {
        onSortTypeChange('alphabetical');
        onSortDirectionChange('asc');
      } else {
        onSortTypeChange('alphabetical');
        onSortDirectionChange('desc');
      }
    },
    [onSortTypeChange, onSortDirectionChange]
  );

  const options = [
    {
      value: 'alphabetical-asc' as SortOption,
      text: i18n.translate('metricsExperience.sort.alphabeticalAsc', {
        defaultMessage: 'A → Z',
      }),
    },
    {
      value: 'alphabetical-desc' as SortOption,
      text: i18n.translate('metricsExperience.sort.alphabeticalDesc', {
        defaultMessage: 'Z → A',
      }),
    },
    {
      value: 'relevance-desc' as SortOption,
      text: i18n.translate('metricsExperience.sort.relevance', {
        defaultMessage: 'Relevance{noData}',
        values: {
          noData: hasRelevanceData
            ? ''
            : i18n.translate('metricsExperience.sort.relevanceNoHttp', {
                defaultMessage: ' (no signal)',
              }),
        },
      }),
    },
  ];

  return (
    <EuiSelect
      compressed
      value={currentValue}
      options={options}
      onChange={onChange}
      aria-label={i18n.translate('metricsExperience.sort.ariaLabel', {
        defaultMessage: 'Sort metrics',
      })}
      data-test-subj="metricsExperienceSortSelector"
    />
  );
};

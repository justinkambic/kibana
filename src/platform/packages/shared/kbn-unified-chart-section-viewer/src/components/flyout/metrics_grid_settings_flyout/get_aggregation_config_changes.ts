/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

import type { MetricsGridSettings } from '@kbn/discover-utils';
import type {
  MetricAggregationConfigChangedEvent,
  MetricAggregationConfigMetricType,
} from '../../observability/metrics/telemetry';
import { AGGREGATION_SETTING_KEYS } from './constants';

type AggregationSetting = (typeof AGGREGATION_SETTING_KEYS)[number];

const METRIC_TYPE_BY_SETTING: Record<AggregationSetting, MetricAggregationConfigMetricType> = {
  counterAggregation: 'counter',
  gaugeAggregation: 'gauge',
  histogramPercentile: 'histogram',
};

/**
 * Builds the aggregation-config telemetry events for a settings update. Iterates the known
 * aggregation settings rather than the update's own keys, so settings the flyout owns but
 * which have no metric type (e.g. `hideExemplars`) are structurally excluded.
 */
export const getAggregationConfigChanges = (
  gridSettings: MetricsGridSettings,
  update: Partial<MetricsGridSettings>
): MetricAggregationConfigChangedEvent[] =>
  AGGREGATION_SETTING_KEYS.flatMap((setting) => {
    const newAggregation = update[setting];

    if (newAggregation === undefined) {
      return [];
    }

    return [
      {
        metric_type: METRIC_TYPE_BY_SETTING[setting],
        previous_aggregation: gridSettings[setting],
        new_aggregation: newAggregation,
      },
    ];
  });

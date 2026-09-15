/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

import {
  METRICS_GRID_HISTOGRAM_PERCENTILES,
  METRICS_GRID_SIMPLE_AGGREGATIONS,
  type HistogramPercentile,
  type MetricsGridSettings,
} from '@kbn/discover-utils';

/**
 * Flyout settings that map to an aggregation-config telemetry event. Keeping these in their
 * own tuple is what lets `getAggregationConfigChanges` iterate a known-exhaustive list rather
 * than casting `Object.keys`, so a non-aggregation setting can never reach that payload.
 *
 * Do not reorder: the emitted event order is asserted by existing tests.
 */
export const AGGREGATION_SETTING_KEYS = [
  'counterAggregation',
  'gaugeAggregation',
  'histogramPercentile',
] as const satisfies ReadonlyArray<keyof MetricsGridSettings>;

/** Settings owned by this flyout. */
export const FLYOUT_SETTING_KEYS = [
  ...AGGREGATION_SETTING_KEYS,
  'hideExemplars',
] as const satisfies ReadonlyArray<keyof MetricsGridSettings>;

export const SIMPLE_AGGREGATION_OPTIONS = METRICS_GRID_SIMPLE_AGGREGATIONS;

export const HISTOGRAM_PERCENTILE_OPTIONS = METRICS_GRID_HISTOGRAM_PERCENTILES;

export const HISTOGRAM_PERCENTILE_VALUES: Record<HistogramPercentile, number> = {
  p50: 50,
  p75: 75,
  p90: 90,
  p95: 95,
  p99: 99,
};

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
  METRICS_GRID_SETTINGS_DEFAULTS,
  METRICS_GRID_SIMPLE_AGGREGATIONS,
} from '@kbn/discover-utils';
import {
  AGGREGATION_SETTING_KEYS,
  FLYOUT_SETTING_KEYS,
  HISTOGRAM_PERCENTILE_OPTIONS,
  HISTOGRAM_PERCENTILE_VALUES,
  SIMPLE_AGGREGATION_OPTIONS,
} from './constants';

describe('grid_settings constants', () => {
  it('exposes defaults matching the pre-existing hardcoded aggregation behavior', () => {
    expect(METRICS_GRID_SETTINGS_DEFAULTS).toEqual({
      counterAggregation: 'sum',
      gaugeAggregation: 'avg',
      histogramPercentile: 'p95',
      hideExemplars: false,
      dimensions: [],
      searchTerm: '',
    });
  });

  it('owns hideExemplars as a flyout setting', () => {
    expect(FLYOUT_SETTING_KEYS).toContain('hideExemplars');
  });

  it('excludes hideExemplars from the aggregation settings', () => {
    // Aggregation settings drive a telemetry event carrying a required `metric_type`.
    // `hideExemplars` has no metric type, so it must stay out of this tuple.
    expect(AGGREGATION_SETTING_KEYS).not.toContain('hideExemplars');
    expect(AGGREGATION_SETTING_KEYS).toEqual([
      'counterAggregation',
      'gaugeAggregation',
      'histogramPercentile',
    ]);
  });

  it('uses the canonical simple aggregation options', () => {
    expect(SIMPLE_AGGREGATION_OPTIONS).toBe(METRICS_GRID_SIMPLE_AGGREGATIONS);
  });

  it('uses the canonical histogram percentile options', () => {
    expect(HISTOGRAM_PERCENTILE_OPTIONS).toBe(METRICS_GRID_HISTOGRAM_PERCENTILES);
  });

  it('maps every histogram percentile option to its numeric value', () => {
    expect(HISTOGRAM_PERCENTILE_VALUES).toEqual({
      p50: 50,
      p75: 75,
      p90: 90,
      p95: 95,
      p99: 99,
    });
  });
});

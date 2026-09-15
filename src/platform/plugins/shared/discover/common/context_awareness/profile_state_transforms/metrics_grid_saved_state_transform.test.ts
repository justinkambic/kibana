/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

import { DiscoverTabType } from '@kbn/discover-session-constants';
import { ProfileStateRegistry } from '../profile_state';
import { METRICS_STATE_DEF } from '../profile_state_definitions/metrics_grid_profile_state';
import { METRICS_GRID_SAVED_STATE_TRANSFORM } from './metrics_grid_saved_state_transform';

const createRegistry = () => {
  const registry = new ProfileStateRegistry();
  registry.registerDefinition(METRICS_STATE_DEF);
  registry.registerTransform(METRICS_GRID_SAVED_STATE_TRANSFORM);
  return registry;
};

describe('METRICS_GRID_SAVED_STATE_TRANSFORM', () => {
  it('saves and restores grid settings', () => {
    const registry = createRegistry();
    const savedState = registry.toSavedState(DiscoverTabType.Metrics, {
      metricsState: {
        counterAggregation: 'max',
        gaugeAggregation: 'min',
        histogramPercentile: 'p50',
        dimensions: ['host.name'],
        searchTerm: 'bytes',
        sortField: 'recency',
        sortDirection: 'desc',
      },
    });

    expect(savedState).toEqual({
      type: DiscoverTabType.Metrics,
      counterAggregation: 'max',
      gaugeAggregation: 'min',
      histogramPercentile: 'p50',
      dimensions: ['host.name'],
      searchTerm: 'bytes',
    });
    expect(registry.fromSavedState(savedState)).toEqual({
      metricsState: {
        counterAggregation: 'max',
        gaugeAggregation: 'min',
        histogramPercentile: 'p50',
        dimensions: ['host.name'],
        searchTerm: 'bytes',
      },
    });
  });

  it('expands grid setting defaults when saving', () => {
    expect(createRegistry().toSavedState(DiscoverTabType.Metrics, {})).toEqual({
      type: DiscoverTabType.Metrics,
      counterAggregation: 'sum',
      gaugeAggregation: 'avg',
      histogramPercentile: 'p95',
      dimensions: [],
      searchTerm: '',
    });
  });

  it('does not save hideExemplars, which is a per-tab display preference', () => {
    // `hideExemplars` is deliberately omitted from `toSavedState`, matching how
    // `sortField`/`sortDirection` are handled: it is a display preference scoped to the
    // Discover tab, not part of a shared saved session.
    //
    // Do not "fix" this by adding the key. The saved object is validated by
    // SCHEMA_TAB_TYPE_STATE_V16 in saved_search/server/saved_objects/schema.ts, which
    // enumerates the allowed keys and rejects unknown ones, and the public API schema in
    // kbn-as-code/discover-schema is zod `.strict()`. Emitting it without a saved-object
    // model version bump and matching schema/converter updates fails validation at runtime.
    const savedState = createRegistry().toSavedState(DiscoverTabType.Metrics, {
      metricsState: { hideExemplars: true },
    });

    expect(savedState).not.toHaveProperty('hideExemplars');
  });
});

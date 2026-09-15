/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EuiSuperSelectTestHarness } from '@kbn/test-eui-helpers';
import { GridSettingsFlyout } from './grid_settings_flyout';
import { METRICS_GRID_SETTINGS_DEFAULTS, type MetricsGridSettings } from '@kbn/discover-utils';
import { ExternalServicesProvider } from '../../../context/external_services';
import { createFeatureFlagsMock } from '../../../test_utils/create_feature_flags_mock';
import { FEATURE_FLAGS } from '../../../common/constants';
import { SHOW_EXEMPLARS_LABEL } from './options';

const mockTrackAggregationConfigChanged = jest.fn();

jest.mock('../../../context/ebt_telemetry_context', () => ({
  useTelemetry: () => ({
    trackAggregationConfigChanged: mockTrackAggregationConfigChanged,
  }),
}));

const defaultSettings: MetricsGridSettings = { ...METRICS_GRID_SETTINGS_DEFAULTS };

const EXEMPLARS_SWITCH_SUBJ = 'metricsExperienceGridSettingsExemplarsSwitch';

/**
 * Renders the flyout with the exemplars feature flag resolved to `exemplarsEnabled`. Without a
 * provider `useFeatureFlag` falls back to the flag's default (`false`), which is what the
 * pre-existing tests below rely on.
 */
const renderFlyout = ({
  gridSettings = defaultSettings,
  onGridSettingsChange = jest.fn(),
  onClose = jest.fn(),
  exemplarsEnabled,
}: {
  gridSettings?: MetricsGridSettings;
  onGridSettingsChange?: jest.Mock;
  onClose?: jest.Mock;
  exemplarsEnabled: boolean;
}) => {
  render(
    <ExternalServicesProvider
      externalServices={{
        featureFlags: createFeatureFlagsMock({
          [FEATURE_FLAGS.IS_EXEMPLARS_ENABLED]: exemplarsEnabled,
        }),
      }}
    >
      <GridSettingsFlyout
        gridSettings={gridSettings}
        onGridSettingsChange={onGridSettingsChange}
        onClose={onClose}
      />
    </ExternalServicesProvider>
  );

  return { onGridSettingsChange, onClose };
};

const counterSelect = new EuiSuperSelectTestHarness('metricsExperienceGridSettingsCounterSelect');
const gaugeSelect = new EuiSuperSelectTestHarness('metricsExperienceGridSettingsGaugeSelect');
const histogramSelect = new EuiSuperSelectTestHarness(
  'metricsExperienceGridSettingsHistogramSelect'
);

describe('GridSettingsFlyout', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the aggregation settings inside an accordion that is open by default', () => {
    render(
      <GridSettingsFlyout
        gridSettings={defaultSettings}
        onGridSettingsChange={jest.fn()}
        onClose={jest.fn()}
      />
    );

    expect(
      screen.getByTestId('metricsExperienceGridSettingsAggregationAccordion')
    ).toBeInTheDocument();
    expect(counterSelect.getSelected()).toContain('Sum');
    expect(gaugeSelect.getSelected()).toContain('Average');
    expect(histogramSelect.getSelected()).toContain('95th percentile');
  });

  it('disables "Apply and close" until a selection actually changes', async () => {
    render(
      <GridSettingsFlyout
        gridSettings={defaultSettings}
        onGridSettingsChange={jest.fn()}
        onClose={jest.fn()}
      />
    );

    expect(screen.getByTestId('metricsExperienceGridSettingsApplyButton')).toBeDisabled();

    await counterSelect.select('metricsExperienceGridSettingsCounterOption-max');

    expect(screen.getByTestId('metricsExperienceGridSettingsApplyButton')).toBeEnabled();
  });

  it('does not call onGridSettingsChange until "Apply and close" is clicked, then closes', async () => {
    const onGridSettingsChange = jest.fn();
    const onClose = jest.fn();
    render(
      <GridSettingsFlyout
        gridSettings={defaultSettings}
        onGridSettingsChange={onGridSettingsChange}
        onClose={onClose}
      />
    );

    await counterSelect.select('metricsExperienceGridSettingsCounterOption-max');

    expect(onGridSettingsChange).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();

    await userEvent.click(screen.getByTestId('metricsExperienceGridSettingsApplyButton'));

    expect(mockTrackAggregationConfigChanged).toHaveBeenCalledWith({
      metric_type: 'counter',
      previous_aggregation: 'sum',
      new_aggregation: 'max',
    });
    expect(onGridSettingsChange).toHaveBeenCalledWith({ counterAggregation: 'max' });
    expect(onClose).toHaveBeenCalled();
  });

  it('reports each changed metric type when multiple settings are applied', async () => {
    render(
      <GridSettingsFlyout
        gridSettings={defaultSettings}
        onGridSettingsChange={jest.fn()}
        onClose={jest.fn()}
      />
    );

    await gaugeSelect.select('metricsExperienceGridSettingsGaugeOption-min');
    await histogramSelect.select('metricsExperienceGridSettingsHistogramOption-p99');
    await userEvent.click(screen.getByTestId('metricsExperienceGridSettingsApplyButton'));

    expect(mockTrackAggregationConfigChanged).toHaveBeenCalledTimes(2);
    expect(mockTrackAggregationConfigChanged).toHaveBeenNthCalledWith(1, {
      metric_type: 'gauge',
      previous_aggregation: 'avg',
      new_aggregation: 'min',
    });
    expect(mockTrackAggregationConfigChanged).toHaveBeenNthCalledWith(2, {
      metric_type: 'histogram',
      previous_aggregation: 'p95',
      new_aggregation: 'p99',
    });
  });

  it('discards the draft and does not call onGridSettingsChange when Cancel is clicked', async () => {
    const onGridSettingsChange = jest.fn();
    const onClose = jest.fn();
    render(
      <GridSettingsFlyout
        gridSettings={defaultSettings}
        onGridSettingsChange={onGridSettingsChange}
        onClose={onClose}
      />
    );

    await counterSelect.select('metricsExperienceGridSettingsCounterOption-max');

    await userEvent.click(screen.getByTestId('metricsExperienceGridSettingsCancelButton'));

    expect(onGridSettingsChange).not.toHaveBeenCalled();
    expect(mockTrackAggregationConfigChanged).not.toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });

  describe('exemplars control', () => {
    it('renders the exemplars switch, checked, when the feature flag is enabled', () => {
      renderFlyout({ exemplarsEnabled: true });

      expect(
        screen.getByTestId('metricsExperienceGridSettingsExemplarsAccordion')
      ).toBeInTheDocument();
      // Checked means "showing exemplars": the default `hideExemplars: false` is inverted.
      expect(screen.getByTestId(EXEMPLARS_SWITCH_SUBJ)).toBeChecked();
      expect(screen.getByText(SHOW_EXEMPLARS_LABEL)).toBeInTheDocument();
    });

    it('renders the switch unchecked when exemplars are already hidden', () => {
      renderFlyout({
        gridSettings: { ...defaultSettings, hideExemplars: true },
        exemplarsEnabled: true,
      });

      expect(screen.getByTestId(EXEMPLARS_SWITCH_SUBJ)).not.toBeChecked();
    });

    it('hides the exemplars control, but not the aggregation selects, when the flag is disabled', () => {
      renderFlyout({ exemplarsEnabled: false });

      expect(screen.queryByTestId(EXEMPLARS_SWITCH_SUBJ)).not.toBeInTheDocument();
      expect(
        screen.queryByTestId('metricsExperienceGridSettingsExemplarsAccordion')
      ).not.toBeInTheDocument();
      // No collateral damage to the pre-existing settings.
      expect(screen.getByTestId('metricsExperienceGridSettingsCounterSelect')).toBeInTheDocument();
      expect(screen.getByTestId('metricsExperienceGridSettingsGaugeSelect')).toBeInTheDocument();
      expect(
        screen.getByTestId('metricsExperienceGridSettingsHistogramSelect')
      ).toBeInTheDocument();
    });

    it('applies hideExemplars: true when the switch is turned off', async () => {
      const { onGridSettingsChange } = renderFlyout({ exemplarsEnabled: true });

      await userEvent.click(screen.getByTestId(EXEMPLARS_SWITCH_SUBJ));
      await userEvent.click(screen.getByTestId('metricsExperienceGridSettingsApplyButton'));

      expect(onGridSettingsChange).toHaveBeenCalledWith({ hideExemplars: true });
    });

    it('applies hideExemplars: false when the switch is turned back on', async () => {
      // Guards against an inverted `onChange`, which the "off" case alone would not catch.
      const { onGridSettingsChange } = renderFlyout({
        gridSettings: { ...defaultSettings, hideExemplars: true },
        exemplarsEnabled: true,
      });

      await userEvent.click(screen.getByTestId(EXEMPLARS_SWITCH_SUBJ));
      await userEvent.click(screen.getByTestId('metricsExperienceGridSettingsApplyButton'));

      expect(onGridSettingsChange).toHaveBeenCalledWith({ hideExemplars: false });
    });

    it('does not emit aggregation telemetry for an exemplars-only change', async () => {
      // `metric_type` is a required keyword in the EBT schema and `hideExemplars` has none,
      // so this setting must never reach the aggregation-config event.
      renderFlyout({ exemplarsEnabled: true });

      await userEvent.click(screen.getByTestId(EXEMPLARS_SWITCH_SUBJ));
      await userEvent.click(screen.getByTestId('metricsExperienceGridSettingsApplyButton'));

      expect(mockTrackAggregationConfigChanged).not.toHaveBeenCalled();
    });

    it('emits only the aggregation event when an aggregation and the switch change together', async () => {
      const { onGridSettingsChange } = renderFlyout({ exemplarsEnabled: true });

      await counterSelect.select('metricsExperienceGridSettingsCounterOption-max');
      await userEvent.click(screen.getByTestId(EXEMPLARS_SWITCH_SUBJ));
      await userEvent.click(screen.getByTestId('metricsExperienceGridSettingsApplyButton'));

      expect(mockTrackAggregationConfigChanged).toHaveBeenCalledTimes(1);
      expect(mockTrackAggregationConfigChanged).toHaveBeenCalledWith({
        metric_type: 'counter',
        previous_aggregation: 'sum',
        new_aggregation: 'max',
      });
      expect(onGridSettingsChange).toHaveBeenCalledWith({
        counterAggregation: 'max',
        hideExemplars: true,
      });
    });

    it('enables "Apply and close" on a switch change alone, and discards it on Cancel', async () => {
      const { onGridSettingsChange, onClose } = renderFlyout({ exemplarsEnabled: true });

      expect(screen.getByTestId('metricsExperienceGridSettingsApplyButton')).toBeDisabled();

      await userEvent.click(screen.getByTestId(EXEMPLARS_SWITCH_SUBJ));

      expect(screen.getByTestId('metricsExperienceGridSettingsApplyButton')).toBeEnabled();

      await userEvent.click(screen.getByTestId('metricsExperienceGridSettingsCancelButton'));

      expect(onGridSettingsChange).not.toHaveBeenCalled();
      expect(onClose).toHaveBeenCalled();
    });
  });

  it('discards the draft and does not call onGridSettingsChange when the flyout close button is clicked', async () => {
    const onGridSettingsChange = jest.fn();
    const onClose = jest.fn();
    render(
      <GridSettingsFlyout
        gridSettings={defaultSettings}
        onGridSettingsChange={onGridSettingsChange}
        onClose={onClose}
      />
    );

    await counterSelect.select('metricsExperienceGridSettingsCounterOption-max');

    await userEvent.click(screen.getByTestId('euiFlyoutCloseButton'));

    expect(onGridSettingsChange).not.toHaveBeenCalled();
    expect(mockTrackAggregationConfigChanged).not.toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });
});

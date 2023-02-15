/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React, { useEffect, useRef } from 'react';

import { euiStyled } from '@kbn/kibana-react-plugin/common';
import {
  Axis,
  BarSeries,
  Chart,
  Settings,
  ColorVariant,
  ScaleType,
  LineSeries,
  Position,
} from '@elastic/charts';

import {
  EuiFlyout,
  EuiFlyoutHeader,
  EuiFlyoutBody,
  EuiTitle,
  EuiSpacer,
  EuiFlexItem,
  EuiStat,
  EuiFlexGroup,
} from '@elastic/eui';
import { i18n } from '@kbn/i18n';
import { METRIC_TYPE, useUiTracker } from '@kbn/observability-plugin/public';
import { Table } from './waterfall_flyout_table';
import { MiddleTruncatedText } from '../middle_truncated_text';
import { WaterfallMetadataEntry } from '../../../common/network_data/types';
import { OnFlyoutClose } from './use_flyout';
import { useApmData } from './use_apm_data';

export const DETAILS = i18n.translate('xpack.synthetics.synthetics.waterfall.flyout.details', {
  defaultMessage: 'Details',
});

export const CERTIFICATES = i18n.translate(
  'xpack.synthetics.synthetics.waterfall.flyout.certificates',
  {
    defaultMessage: 'Certificate headers',
  }
);

export const REQUEST_HEADERS = i18n.translate(
  'xpack.synthetics.synthetics.waterfall.flyout.requestHeaders',
  {
    defaultMessage: 'Request headers',
  }
);

export const RESPONSE_HEADERS = i18n.translate(
  'xpack.synthetics.synthetics.waterfall.flyout.responseHeaders',
  {
    defaultMessage: 'Response headers',
  }
);

const FlyoutContainer = euiStyled(EuiFlyout)`
  z-index: ${(props) => props.theme.eui.euiZLevel5};
`;

export interface WaterfallFlyoutProps {
  flyoutData?: WaterfallMetadataEntry;
  onFlyoutClose: OnFlyoutClose;
  isFlyoutVisible?: boolean;
}
const metricMap = ({ x: xx, y: yy }) => [xx, yy];
export const WaterfallFlyout = ({
  flyoutData,
  isFlyoutVisible,
  onFlyoutClose,
}: WaterfallFlyoutProps) => {
  const flyoutRef = useRef<HTMLDivElement>(null);
  const trackMetric = useUiTracker({ app: 'uptime' });
  const apmData = useApmData();
  console.log('apm data', apmData);

  useEffect(() => {
    if (isFlyoutVisible && flyoutData && flyoutRef.current) {
      flyoutRef.current?.focus();
    }
  }, [flyoutData, isFlyoutVisible, flyoutRef]);

  if (!flyoutData || !isFlyoutVisible) {
    return null;
  }

  const { x, url, details, certificates, requestHeaders, responseHeaders } = flyoutData;

  trackMetric({ metric: 'waterfall_flyout', metricType: METRIC_TYPE.CLICK });

  const latency =
    apmData?.currentPeriod['3f188c1fc5e41212b7301a44063e1318c10248678ba58a9ec542905e7ce49160']
      .latency;
  const chartData = latency?.map(metricMap) ?? [];
  console.log('chart data', chartData);
  const throughput =
    apmData?.currentPeriod[
      '3f188c1fc5e41212b7301a44063e1318c10248678ba58a9ec542905e7ce49160'
    ].throughput.map(metricMap) ?? [];
  console.log('cpu usage', throughput);
  const latencyTitle = Number(
    latency?.reduce((prev, { y: ly }) => prev + ly, 0) / latency?.length ?? 1 / 1000
  ).toFixed(0);
  console.log('latency title', latencyTitle);
  const height = 110;
  return (
    <div
      tab-index={-1}
      ref={flyoutRef}
      data-test-subj="waterfallFlyout"
      aria-labelledby="flyoutTitle"
    >
      <FlyoutContainer size="s" onClose={onFlyoutClose}>
        <EuiFlyoutHeader hasBorder>
          <EuiTitle size="s">
            <h2 id="flyoutTitle">
              <EuiFlexItem>
                <MiddleTruncatedText
                  index={x + 1}
                  text={url}
                  url={url}
                  ariaLabel={url}
                  highestIndex={x + 1}
                />
              </EuiFlexItem>
            </h2>
          </EuiTitle>
        </EuiFlyoutHeader>
        <EuiFlyoutBody>
          <EuiFlexGroup>
            <EuiFlexItem grow={false}>
              <EuiStat title={latencyTitle} description="Avg. latency" />
            </EuiFlexItem>
            <EuiFlexItem>
              {typeof apmData !== 'undefined' && (
                <div>
                  <span>APM Transaction</span>
                  <Chart size={{ width: 250, height }}>
                    <Settings />
                    <Axis
                      id="left"
                      title={'Latency'}
                      position={Position.Left}
                      tickFormat={(d) => `${Number(d) / 1000}s`}
                    />
                    <LineSeries
                      id="lines"
                      xScaleType={ScaleType.Time}
                      yScaleType={ScaleType.Linear}
                      xAccessor={0}
                      yAccessors={[1]}
                      data={chartData}
                    />
                  </Chart>
                </div>
              )}
            </EuiFlexItem>
          </EuiFlexGroup>
          {typeof throughput !== 'undefined' && (
            <Chart size={{ width: 250, height }}>
              <Settings />
              <Axis
                id="left"
                title={'Throughput'}
                position={Position.Left}
                tickFormat={(d) => `${Number(d)}`}
              />
              <LineSeries
                id="lines"
                xScaleType={ScaleType.Time}
                yScaleType={ScaleType.Linear}
                xAccessor={0}
                yAccessors={[1]}
                data={throughput}
              />
            </Chart>
          )}
        </EuiFlyoutBody>
      </FlyoutContainer>
    </div>
  );
};

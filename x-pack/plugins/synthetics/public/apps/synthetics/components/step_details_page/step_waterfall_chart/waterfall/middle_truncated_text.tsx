/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React, { useMemo } from 'react';
import { FormattedMessage } from '@kbn/i18n-react';
import {
  EuiButtonEmpty,
  EuiScreenReaderOnly,
  EuiToolTip,
  EuiLink,
  EuiText,
  EuiIcon,
  EuiButtonIcon,
} from '@elastic/eui';
import { i18n } from '@kbn/i18n';
import { euiStyled } from '@kbn/kibana-react-plugin/common';
import { WaterfallTooltipContent } from './waterfall_tooltip_content';
import { WaterfallChartTooltip } from './styles';
import { FIXED_AXIS_HEIGHT, RESOURCE_TITLE_FONT_SIZE } from './constants';
import { formatTooltipHeading } from '../../common/network_data/data_formatting';
import { useWaterfallContext } from './context/waterfall_context';
import { useStepMetrics } from '../../hooks/use_step_metrics';

interface Props {
  index: number;
  highestIndex: number;
  ariaLabel: string;
  text: string;
  onClick?: (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void;
  setButtonRef?: (ref: HTMLButtonElement | HTMLAnchorElement | null) => void;
  url: string;
}

const OuterContainer = euiStyled.span`
  position: relative;
  display: inline-flex;
  align-items: center;
  .euiToolTipAnchor {
    min-width: 0;
  }
`; // NOTE: min-width: 0 ensures flexbox and no-wrap children can co-exist

const InnerContainer = euiStyled.span`
  overflow: hidden;
  display: flex;
  align-items: center;
`;

const IndexNumber = euiStyled(EuiText)`
  font-family: ${(props) => props.theme.eui.euiCodeFontFamily};
  margin-right: ${(props) => props.theme.eui.euiSizeS};
  line-height: ${FIXED_AXIS_HEIGHT}px;
  text-align: right;
  background-color: ${(props) => props.theme.eui.euiColorLightestShade};
  text-align: center;
  color: ${(props) => props.theme.eui.euiColorDarkShade};
`;

const FirstChunk = euiStyled.span`
  text-overflow: ellipsis;
  white-space: nowrap;
  overflow: hidden;
  line-height: ${FIXED_AXIS_HEIGHT}px;
  font-size: ${RESOURCE_TITLE_FONT_SIZE}px;
  text-align: left;
`; // safari doesn't auto align text left in some cases

const LastChunk = euiStyled.span`
  flex-shrink: 0;
  line-height: ${FIXED_AXIS_HEIGHT}px;
  font-size: ${RESOURCE_TITLE_FONT_SIZE}px;
  text-align: left;
`; // safari doesn't auto align text left in some cases

const StyledButton = euiStyled(EuiButtonEmpty)`
  &&& {
    border: none;

    .euiButtonContent {
      display: inline-block;
      padding: 0;
    }
  }
`;

const SecureIcon = euiStyled(EuiIcon)`
  margin-right: ${(props) => props.theme.eui.euiSizeXS};
`;

export const getChunks = (text: string = '') => {
  const END_CHARS = 12;
  const chars = text.split('');
  const splitPoint = chars.length - END_CHARS > 0 ? chars.length - END_CHARS : null;
  const endChars = splitPoint ? chars.splice(splitPoint) : [];
  return { first: chars.join(''), last: endChars.join('') };
};

// Helper component for adding middle text truncation, e.g.
// really-really-really-long....Compressed.js
// Can be used to accommodate content in sidebar item rendering.
export const MiddleTruncatedText = ({
  index,
  ariaLabel,
  text: fullText,
  onClick,
  setButtonRef,
  url,
  highestIndex,
}: Props) => {
  // const { activeStep } = useWaterfallContext();
  // const { totalDuration } = useStepMetrics(activeStep);
  // const duration = totalDuration?.value;
  // const start = new Date(activeStep?.['@timestamp']!).valueOf();
  // const end = start + duration!;

  const secureHttps = fullText.startsWith('https://');
  const text = fullText.replace(/https:\/\/www.|http:\/\/www.|http:\/\/|https:\/\//, '');

  const chunks = useMemo(() => {
    return getChunks(text);
  }, [text]);

  return (
    <OuterContainer aria-label={ariaLabel} data-test-subj="middleTruncatedTextContainer">
      <EuiScreenReaderOnly>
        <span data-test-subj="middleTruncatedTextSROnly">{fullText}</span>
      </EuiScreenReaderOnly>

      <WaterfallChartTooltip
        as={EuiToolTip}
        content={
          <WaterfallTooltipContent {...{ text: formatTooltipHeading(index, fullText), url }} />
        }
        data-test-subj="middleTruncatedTextToolTip"
        delay="long"
        position="top"
      >
        <>
          {onClick ? (
            <StyledButton
              onClick={onClick}
              data-test-subj={`middleTruncatedTextButton${index}`}
              buttonRef={setButtonRef}
              flush={'left'}
            >
              <InnerContainer>
                <IndexNumber
                  css={{ minWidth: `${String(highestIndex).length + 3}ch` }}
                  color="subdued"
                  size="s"
                >
                  {index}
                </IndexNumber>
                {secureHttps && (
                  <SecureIcon
                    type="lock"
                    size="s"
                    color="success"
                    aria-label={i18n.translate(
                      'xpack.synthetics.waterfallChart.sidebar.url.https',
                      {
                        defaultMessage: 'https',
                      }
                    )}
                  />
                )}
                <FirstChunk>{chunks.first}</FirstChunk>
                <LastChunk>{chunks.last}</LastChunk>
              </InnerContainer>
            </StyledButton>
          ) : (
            <InnerContainer aria-hidden={true}>
              <FirstChunk>
                {index}. {chunks.first}
              </FirstChunk>
              <LastChunk>{chunks.last}</LastChunk>
            </InnerContainer>
          )}
        </>
      </WaterfallChartTooltip>
      <span>
        <EuiLink href={url} external target="_blank">
          <EuiScreenReaderOnly>
            <span>
              <FormattedMessage
                id="xpack.synthetics.synthetics.waterfall.resource.externalLink"
                defaultMessage="Open resource in new tab"
              />
            </span>
          </EuiScreenReaderOnly>
        </EuiLink>
      </span>
      <span>
        {url.indexOf('/js/') !== -1 && (
          <EuiButtonIcon
            href="/app/apm/services/heartbeat/overview?comparisonEnabled=true&environment=ENVIRONMENT_ALL&kuery=&latencyAggregationType=avg&offset=1d&rangeFrom=2023-02-15T18:57:00.000Z&rangeTo=2023-02-15T19:00:00.000Z&serviceGroup=&transactionType=output"
            iconType="iInCircle"
            target="_blank"
          />
        )}
      </span>
    </OuterContainer>
  );
};

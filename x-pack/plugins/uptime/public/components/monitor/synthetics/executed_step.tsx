/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import { EuiFlexItem, EuiFlexGroup, EuiSpacer, EuiText } from '@elastic/eui';
import { FormattedMessage } from '@kbn/i18n/react';
import React, { FC } from 'react';
import { i18n } from '@kbn/i18n';
import { Accordion } from './accordion';
import { StepScreenshotDisplay } from './step_screenshot_display';
import { StatusBadge } from './status_badge';
import { Ping } from '../../../../common/runtime_types';

const CODE_BLOCK_OVERFLOW_HEIGHT = 360;

interface ExecutedStepProps {
  step: Ping;
  index: number;
  fetchScreenshot: (stepIndex: number) => void;
}

export const ExecutedStep: FC<ExecutedStepProps> = ({ step, index, fetchScreenshot }) => (
  <>
    <div style={{ padding: '8px' }}>
      <div>
        <EuiText>
          <strong>
            <FormattedMessage
              id="xpack.uptime.synthetics.executedStep.stepName"
              defaultMessage="{stepNumber}. {stepName}"
              values={{
                stepNumber: index + 1,
                stepName: step.synthetics?.step?.name,
              }}
            />
          </strong>
        </EuiText>
      </div>
      <EuiSpacer size="s" />
      <div>
        <StatusBadge status={step.synthetics?.payload?.status} />
      </div>
      <EuiSpacer />
      <div>
        <EuiFlexGroup>
          <EuiFlexItem grow={false}>
            <StepScreenshotDisplay
              isLoading={step.synthetics?.screenshotLoading}
              screenshot={step.synthetics?.blob}
              stepIndex={step.synthetics?.step?.index}
              stepName={step.synthetics?.step?.name}
              fetchScreenshot={fetchScreenshot}
            />
          </EuiFlexItem>
          <EuiFlexItem>
            <Accordion
              id={step.synthetics?.step?.name + String(index)}
              buttonContent={i18n.translate('xpack.uptime.synthetics.executedStep.scriptHeading', {
                defaultMessage: 'Step script',
              })}
              overflowHeight={CODE_BLOCK_OVERFLOW_HEIGHT}
              language="javascript"
            >
              {step.synthetics?.payload?.source}
            </Accordion>
            <Accordion
              id={`${step.synthetics?.step?.name}_error`}
              buttonContent={i18n.translate('xpack.uptime.synthetics.executedStep.errorHeading', {
                defaultMessage: 'Error',
              })}
              language="html"
              overflowHeight={CODE_BLOCK_OVERFLOW_HEIGHT}
            >
              {step.synthetics?.payload?.error?.message}
            </Accordion>
            <Accordion
              id={`${step.synthetics?.step?.name}_stack`}
              buttonContent={i18n.translate('xpack.uptime.synthetics.executedStep.stackTrace', {
                defaultMessage: 'Stack trace',
              })}
              language="html"
              overflowHeight={CODE_BLOCK_OVERFLOW_HEIGHT}
            >
              {step.synthetics?.payload?.error?.stack}
            </Accordion>
          </EuiFlexItem>
        </EuiFlexGroup>
      </div>
    </div>
    <EuiSpacer />
  </>
);

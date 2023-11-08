/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { EuiDescribedFormGroup, EuiFieldNumber, EuiForm, EuiFormRow, EuiPanel } from '@elastic/eui';
import { i18n } from '@kbn/i18n';
import { FormattedMessage } from '@kbn/i18n-react';
import React, { useState } from 'react';

export const TLSSettings = () => {
  const [val, setVal] = useState<number>(1);
  return (
    <EuiPanel hasShadow={false} hasBorder={true}>
      <EuiForm>
        <EuiDescribedFormGroup
          title={
            <h4>
              <FormattedMessage
                id="xpack.synthetics.settings.tls.ageWarningThreshold.descriptionHeading"
                defaultMessage="Certificate Warning Threshold"
              />
            </h4>
          }
          description={
            <FormattedMessage
              id="xpack.synthetics.settings.tls.ageWarningThreshold.description"
              defaultMessage="Specify a maximum age for monitored certificates. When a certificate's age exceeds this span, the page will display a warning."
            />
          }
        >
          <EuiFormRow
            label={i18n.translate('xpack.settings.tlsPage.warningThreshold.label', {
              defaultMessage: 'Certificate warning threshold',
            })}
          >
            <EuiFieldNumber
              data-test-subj="xpack.settings.tlsPage.warningThreshold.input"
              placeholder={i18n.translate('xpack.settings.tlsPage.warningThreshold.placeholder', {
                defaultMessage: 'Threshold for highlighting certificate age on TLS page',
              })}
              value={val}
              onChange={(e) => setVal(Number(e.currentTarget.value))}
            />
          </EuiFormRow>
        </EuiDescribedFormGroup>
      </EuiForm>
    </EuiPanel>
  );
};

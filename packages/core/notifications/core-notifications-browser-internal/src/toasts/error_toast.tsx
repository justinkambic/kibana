/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

import React from 'react';
import ReactDOM from 'react-dom';

import {
  EuiButton,
  EuiCallOut,
  EuiCodeBlock,
  EuiModalBody,
  EuiModalFooter,
  EuiModalHeader,
  EuiModalHeaderTitle,
  EuiSpacer,
} from '@elastic/eui';
import { FormattedMessage } from '@kbn/i18n-react';
import type { AnalyticsServiceStart } from '@kbn/core-analytics-browser';
import type { I18nStart } from '@kbn/core-i18n-browser';
import type { OverlayStart } from '@kbn/core-overlays-browser';
import { ThemeServiceStart } from '@kbn/core-theme-browser';
import { KibanaRenderContextProvider } from '@kbn/react-kibana-context-render';

interface StartServices {
  analytics: AnalyticsServiceStart;
  i18n: I18nStart;
  theme: ThemeServiceStart;
}

interface ErrorToastProps extends StartServices {
  title: string;
  error: Error;
  toastMessage: string;
  openModal: OverlayStart['openModal'];
}

interface RequestError extends Error {
  body?: { attributes?: { error: { caused_by: { type: string; reason: string } } } };
}

const isRequestError = (e: Error | RequestError): e is RequestError => {
  if ('body' in e) {
    return e.body?.attributes?.error?.caused_by !== undefined;
  }
  return false;
};

/**
 * This should instead be replaced by the overlay service once it's available.
 * This does not use React portals so that if the parent toast times out, this modal
 * does not disappear. NOTE: this should use a global modal in the overlay service
 * in the future.
 */
export function showErrorDialog({
  title,
  error,
  openModal,
  ...startServices
}: Pick<ErrorToastProps, 'error' | 'title' | 'openModal' | 'analytics' | 'i18n' | 'theme'>) {
  let text = '';

  if (isRequestError(error)) {
    text += `${error?.body?.attributes?.error?.caused_by.type}\n`;
    text += `${error?.body?.attributes?.error?.caused_by.reason}\n\n`;
  }

  if (error.stack) {
    text += error.stack;
  }

  const modal = openModal(
    mount(
      <KibanaRenderContextProvider {...startServices}>
        <EuiModalHeader>
          <EuiModalHeaderTitle>{title}</EuiModalHeaderTitle>
        </EuiModalHeader>
        <EuiModalBody data-test-subj="errorModalBody">
          <EuiCallOut size="s" color="danger" iconType="error" title={error.message} />
          {text && (
            <React.Fragment>
              <EuiSpacer size="s" />
              <EuiCodeBlock isCopyable={true} paddingSize="s">
                {text}
              </EuiCodeBlock>
            </React.Fragment>
          )}
        </EuiModalBody>
        <EuiModalFooter>
          <EuiButton onClick={() => modal.close()} fill>
            <FormattedMessage
              id="core.notifications.errorToast.closeModal"
              defaultMessage="Close"
            />
          </EuiButton>
        </EuiModalFooter>
      </KibanaRenderContextProvider>
    )
  );
}

export function ErrorToast({
  title,
  error,
  toastMessage,
  openModal,
  ...startServices
}: ErrorToastProps) {
  return (
    <KibanaRenderContextProvider {...startServices}>
      <p data-test-subj="errorToastMessage">{toastMessage}</p>
      <div className="eui-textRight">
        <EuiButton
          size="s"
          color="danger"
          data-test-subj="errorToastBtn"
          onClick={() => showErrorDialog({ title, error, openModal, ...startServices })}
        >
          <FormattedMessage
            id="core.toasts.errorToast.seeFullError"
            defaultMessage="See the full error"
          />
        </EuiButton>
      </div>
    </KibanaRenderContextProvider>
  );
}

const mount = (component: React.ReactElement) => (container: HTMLElement) => {
  ReactDOM.render(component, container);
  return () => ReactDOM.unmountComponentAtNode(container);
};

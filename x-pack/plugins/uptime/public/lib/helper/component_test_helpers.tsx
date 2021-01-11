/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import React, { ReactElement } from 'react';
import { render as reactRender, RenderOptions } from '@testing-library/react';
import { Router } from 'react-router-dom';
import { MemoryHistory } from 'history/createMemoryHistory';
import { createMemoryHistory, History } from 'history';
import { I18nProvider } from '@kbn/i18n/react';
import { mountWithIntl, renderWithIntl, shallowWithIntl } from '@kbn/test/jest';
import { coreMock } from 'src/core/public/mocks';
import { CoreStart } from 'kibana/public';
import {
  KibanaContextProvider,
  KibanaServices,
} from '../../../../../../src/plugins/kibana_react/public';
import { MountWithReduxProvider } from './helper_with_redux';
import { AppState } from '../../state';

interface KibanaProps {
  services?: KibanaServices;
}

interface KibanaProviderOptions {
  coreOptions?: Partial<CoreStart>;
  kibanaProps?: KibanaProps;
}

interface MockKibanaProviderProps extends KibanaProviderOptions {
  children: ReactElement;
}

interface MockRouterProps extends MockKibanaProviderProps {
  history?: History;
}

interface RenderRouterOptions extends KibanaProviderOptions {
  history?: History;
  renderOptions?: Omit<RenderOptions, 'queries'>;
  state?: AppState;
}

/* default mock core */
const defaultCore = coreMock.createStart();
const mockCore: () => CoreStart = () => {
  const core: CoreStart = {
    ...defaultCore,
    application: {
      ...defaultCore.application,
      getUrlForApp: () => '/app/uptime',
      navigateToUrl: jest.fn(),
    },
  };

  return core;
};

/* Higher Order Components */
export function withKibanaContext<T>(
  WrappedComponent: React.ComponentType<T>,
  { kibanaProps, coreOptions }: KibanaProviderOptions
) {
  const core = {
    ...mockCore(),
    coreOptions,
  };
  return (props: any) => (
    <KibanaContextProvider services={{ ...core }} {...kibanaProps}>
      <I18nProvider>
        <WrappedComponent {...(props as T)} />
      </I18nProvider>
    </KibanaContextProvider>
  );
}

export function withRouter<T>(WrappedComponent: React.ComponentType<T>, customHistory: History) {
  const history = customHistory || createMemoryHistory();
  return (props: T) => (
    <Router history={history}>
      <WrappedComponent {...(props as T)} />
    </Router>
  );
}

/* Mock Provider Components */
export function MockKibanaProvider({
  children,
  coreOptions,
  kibanaProps,
}: MockKibanaProviderProps) {
  const core = {
    ...mockCore(),
    coreOptions,
  };
  return (
    <KibanaContextProvider services={{ ...core }} {...kibanaProps}>
      <I18nProvider>{children}</I18nProvider>
    </KibanaContextProvider>
  );
}

export function MockRouter({
  children,
  coreOptions,
  history: customHistory,
  kibanaProps,
}: MockRouterProps) {
  const history = customHistory || createMemoryHistory();
  return (
    <Router history={history}>
      <MockKibanaProvider coreOptions={coreOptions} kibanaProps={kibanaProps}>
        {children}
      </MockKibanaProvider>
    </Router>
  );
}

export const render = (
  ui: ReactElement,
  { history, coreOptions, kibanaProps, renderOptions, state }: RenderRouterOptions = {}
) => {
  return reactRender(
    <MountWithReduxProvider store={state}>
      <MockRouter history={history} kibanaProps={kibanaProps} coreOptions={coreOptions}>
        {ui}
      </MockRouter>
    </MountWithReduxProvider>,
    renderOptions
  );
};

/* Enzyme helpers */
const helperWithRouter: <R>(
  helper: (node: ReactElement) => R,
  component: ReactElement,
  customHistory?: MemoryHistory,
  wrapReduxStore?: boolean,
  storeState?: AppState
) => R = (helper, component, customHistory, wrapReduxStore, storeState) => {
  const history = customHistory ?? createMemoryHistory();

  history.location.key = 'TestKeyForTesting';

  const routerWrapper = <Router history={history}>{component}</Router>;

  if (wrapReduxStore) {
    return helper(
      <MountWithReduxProvider store={storeState}>{routerWrapper}</MountWithReduxProvider>
    );
  }

  return helper(routerWrapper);
};

export const renderWithRouter = (component: ReactElement, customHistory?: MemoryHistory) => {
  return helperWithRouter(renderWithIntl, component, customHistory);
};

export const shallowWithRouter = (component: ReactElement, customHistory?: MemoryHistory) => {
  return helperWithRouter(shallowWithIntl, component, customHistory);
};

export const mountWithRouter = (component: ReactElement, customHistory?: MemoryHistory) => {
  return helperWithRouter(mountWithIntl, component, customHistory);
};

export const renderWithRouterRedux = (component: ReactElement, customHistory?: MemoryHistory) => {
  return helperWithRouter(renderWithIntl, component, customHistory, true);
};

export const shallowWithRouterRedux = (component: ReactElement, customHistory?: MemoryHistory) => {
  return helperWithRouter(shallowWithIntl, component, customHistory, true);
};

export const mountWithRouterRedux = (
  component: ReactElement,
  options?: { customHistory?: MemoryHistory; storeState?: AppState }
) => {
  return helperWithRouter(
    mountWithIntl,
    component,
    options?.customHistory,
    true,
    options?.storeState
  );
};

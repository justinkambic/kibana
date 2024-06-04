/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React, { useEffect } from 'react';
import { Route, Routes } from '@kbn/shared-ux-router';
import { useLocation } from 'react-router-dom-v5-compat';
import { EuiPageTemplate, EuiPanel, EuiSpacer, useEuiTheme } from '@elastic/eui';
import { css } from '@emotion/react';
import backgroundImageUrl from './header/background.svg';
import { Footer } from './footer/footer';
import { OnboardingFlowForm } from './onboarding_flow_form/onboarding_flow_form';
import { Header } from './header/header';
import { SystemLogsPanel } from './quickstart_flows/system_logs';
import { CustomLogsPanel } from './quickstart_flows/custom_logs';
import { BackButton } from './shared/back_button';

const queryClient = new QueryClient();

export function ObservabilityOnboardingFlow() {
  const { pathname } = useLocation();

  const theme = useEuiTheme();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <QueryClientProvider client={queryClient}>
      <EuiPageTemplate.Section
        paddingSize="xl"
        css={css`
          & > div {
            background-image: url(${backgroundImageUrl});
            background-position: right center;
            background-repeat: no-repeat;
          }
          & {
            background-color: ${theme.euiTheme.colors.ghost};
          }
        `}
        grow={false}
        restrictWidth
      >
        <EuiSpacer size="xl" />
        <Header />
      </EuiPageTemplate.Section>
      <EuiPageTemplate.Section paddingSize="xl" color="subdued" restrictWidth>
        <Routes>
          <Route path="/systemLogs">
            <BackButton />
            <SystemLogsPanel />
          </Route>
          <Route path="/customLogs">
            <BackButton />
            <CustomLogsPanel />
          </Route>
          <Route>
            <OnboardingFlowForm />
          </Route>
        </Routes>
        <EuiSpacer size="xl" />
      </EuiPageTemplate.Section>
      <EuiPageTemplate.Section
        contentProps={{ css: { paddingBlock: 0 } }}
        css={css`
          & > .euiPageSection__content-l {
            padding-block: 0px;
          }
          & {
            position: absolute;
            bottom: 0;
            padding-inline: 0px;
          }
        `}
      >
        <EuiPanel
          hasBorder
          css={css`
            border-radius: 0px;
            border-left: none;
            border-bottom: none;
          `}
        >
          <Footer />
          <EuiSpacer size="xl" />
        </EuiPanel>
      </EuiPageTemplate.Section>
    </QueryClientProvider>
  );
}

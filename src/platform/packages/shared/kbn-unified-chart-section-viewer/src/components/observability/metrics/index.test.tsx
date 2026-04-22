/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

import React from 'react';
import { render } from '@testing-library/react';
import type { UnifiedMetricsGridProps } from '../../../types';

// The inner grid component is swapped per-test via this module-scoped holder.
// The `mock` prefix is required so jest.mock's factory can reference it (jest
// hoists jest.mock calls above imports but allows references to `mock*` names).
let mockInnerGridStub: React.ComponentType<UnifiedMetricsGridProps> = () => (
  <div data-test-subj="grid-rendered" />
);

// Mock the inner grid so we can swap in throwing vs. passing stubs per test.
jest.mock('./metrics_experience_grid', () => ({
  MetricsExperienceGrid: (props: UnifiedMetricsGridProps) => {
    const Stub = mockInnerGridStub;
    return <Stub {...props} />;
  },
}));

// PerformanceContextProvider uses react-router-dom's `useLocation()`, which
// requires a Router ancestor not set up in this unit test. Collapse it to a
// passthrough so the error boundary and its wrapped tree are the only things
// under test.
jest.mock('@kbn/ebt-tools', () => ({
  PerformanceContextProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// Import after mocks so modules resolve to stubs.

import UnifiedMetricsExperienceGridWithRestorableState from '.';

// Mirrors `DEFAULT_MAX_ERROR_DURATION_MS` in @kbn/shared-ux-error-boundary's
// error_service.ts. The constant is not exported from the package barrel,
// so we inline it here.
const MAX_ERROR_DURATION_MS = 10_000;

const ThrowingComponent: React.FC = () => {
  throw new Error('This is a test error for the grid boundary.');
};

interface BuildPropsOverrides {
  services?: { analytics?: { reportEvent: jest.Mock } };
}

const buildProps = (overrides: BuildPropsOverrides = {}): UnifiedMetricsGridProps => {
  const { services: servicesOverride } = overrides;
  const services = {
    analytics: { reportEvent: jest.fn() },
    ...servicesOverride,
  } as unknown as UnifiedMetricsGridProps['services'];

  return {
    services,
    actions: {},
    profileId: 'test-profile',
    // Remaining ChartSectionProps members are not read because the inner grid
    // is mocked; cast through unknown to satisfy the type without listing them.
  } as unknown as UnifiedMetricsGridProps;
};

describe('<UnifiedMetricsExperienceGridWithRestorableState>', () => {
  beforeEach(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.useFakeTimers();
    mockInnerGridStub = () => <div data-test-subj="grid-rendered" />;
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it('renders the inner grid when no error is thrown', () => {
    const { getByTestId } = render(
      <UnifiedMetricsExperienceGridWithRestorableState {...buildProps()} />
    );
    expect(getByTestId('grid-rendered')).toBeInTheDocument();
  });

  it('renders the section fatal prompt when an inner component throws', () => {
    mockInnerGridStub = ThrowingComponent;

    const { getByTestId } = render(
      <UnifiedMetricsExperienceGridWithRestorableState {...buildProps()} />
    );

    // The section error boundary replaces the subtree with a fatal prompt
    // carrying this data-test-subj (see message_components.tsx).
    expect(getByTestId('sectionErrorBoundaryPromptHeader')).toBeInTheDocument();
  });

  it('reports the fatal error via services.analytics.reportEvent', async () => {
    const reportEvent = jest.fn();
    mockInnerGridStub = ThrowingComponent;

    render(
      <UnifiedMetricsExperienceGridWithRestorableState
        {...buildProps({ services: { analytics: { reportEvent } } })}
      />
    );

    // Advance past the max-error-duration window so the KibanaErrorService
    // flushes the enqueued report to analytics.
    await jest.advanceTimersByTimeAsync(MAX_ERROR_DURATION_MS);

    expect(reportEvent).toHaveBeenCalledTimes(1);
    expect(reportEvent.mock.calls[0][0]).toBe('fatal-error-react');
    expect(reportEvent.mock.calls[0][1]).toMatchObject({
      component_name: 'ThrowingComponent',
      error_message: 'Error: This is a test error for the grid boundary.',
    });
  });
});

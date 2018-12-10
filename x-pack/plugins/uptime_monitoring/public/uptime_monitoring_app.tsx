/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import {
  EuiHeader,
  EuiHeaderBreadcrumbs,
  // @ts-ignore missing typings for EuiHeaderLogo
  EuiHeaderLogo,
  EuiHeaderSection,
  // @ts-ignore missing typings for EuiHeaderSectionItem
  EuiHeaderSectionItem,
  EuiPage,
  EuiPageContent,
} from '@elastic/eui';
import React from 'react';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import { Breadcrumb } from 'ui/chrome';
import { overviewBreadcrumb } from './breadcrumbs';
import { UpdateBreadcrumbs, UptimeAppProps } from './lib/lib';
import { MonitorPage, OverviewPage } from './pages';

interface UptimeAppState {
  breadcrumbs: Breadcrumb[];
}

class Application extends React.Component<UptimeAppProps, UptimeAppState> {
  private setBreadcrumbs: UpdateBreadcrumbs;
  constructor(props: UptimeAppProps) {
    super(props);

    const { isUsingK7Design, kibanaBreadcrumbs, updateBreadcrumbs } = this.props;

    if (isUsingK7Design) {
      this.setBreadcrumbs = updateBreadcrumbs;
      this.state = {
        breadcrumbs: kibanaBreadcrumbs,
      };
    } else {
      this.setBreadcrumbs = (breadcrumbs: Breadcrumb[]) => this.setState({ breadcrumbs });
      this.state = {
        breadcrumbs: [overviewBreadcrumb],
      };
    }
  }

  public render() {
    return (
      <Router basename="/app/uptime_monitoring#/">
        <EuiPage className="app-wrapper-panel">
          <EuiHeader>
            <EuiHeaderSection>
              <EuiHeaderSectionItem border="right">
                <EuiHeaderLogo
                  aria-label="Go to Uptime Monitoring home page"
                  href="#/"
                  iconType="heartbeatApp"
                  iconTitle="Uptime Monitoring"
                >
                  Uptime Monitoring
                </EuiHeaderLogo>
              </EuiHeaderSectionItem>
              <EuiHeaderSectionItem>
                <EuiHeaderBreadcrumbs
                  breadcrumbs={this.state.breadcrumbs}
                  // @ts-ignore TODO: handle style issues outside of code
                  style={{ paddingTop: '20px', paddingRight: '8px' }}
                />
              </EuiHeaderSectionItem>
            </EuiHeaderSection>
          </EuiHeader>
          <EuiPageContent>
            <Switch>
              <Route
                exact
                path="/"
                render={props => <OverviewPage {...props} setBreadcrumbs={this.setBreadcrumbs} />}
              />
              <Route
                path="/monitor"
                render={props => (
                  <MonitorPage {...props} updateBreadcrumbs={this.concatBreadcrumb} />
                )}
              />
            </Switch>
          </EuiPageContent>
        </EuiPage>
      </Router>
    );
  }

  private concatBreadcrumb = (nextBreadcrumb: Breadcrumb) => {
    const breadcrumbs = this.state.breadcrumbs.concat(nextBreadcrumb);
    this.setState({ breadcrumbs });
  };
}

export const UptimeMonitoringApp = (props: UptimeAppProps) => <Application {...props} />;

/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import { EuiButton, EuiButtonEmpty, EuiFlexGroup, EuiFlexItem, EuiSpacer } from '@elastic/eui';
import 'brace/mode/yaml';

import 'brace/theme/github';
import React from 'react';
import { PrimaryLayout } from '../../components/layouts/primary';
import { TagEdit } from '../../components/tag';
import { ClientSideBeatTag, FrontendLibs } from '../../lib/lib';

interface TagPageProps {
  libs: FrontendLibs;
  history: any;
  match: any;
}

interface TagPageState {
  showFlyout: boolean;
  tag: ClientSideBeatTag;
}

export class TagPage extends React.PureComponent<TagPageProps, TagPageState> {
  constructor(props: TagPageProps) {
    super(props);
    this.state = {
      showFlyout: false,
      tag: {
        id: props.match.params.action === 'create' ? '' : props.match.params.tagid,
        color: '#DD0A73',
        configurations: [],
        last_updated: new Date(),
      },
    };

    if (props.match.params.action !== 'create') {
      this.loadTag();
    }
  }

  public render() {
    return (
      <PrimaryLayout title="Create Tag">
        <div>
          <TagEdit
            tag={this.state.tag}
            onTagChange={(field: string, value: string | number) =>
              this.setState(oldState => {
                let newValue;
                if (field === 'configurations') {
                  newValue = [...oldState.tag.configurations, value];
                } else {
                  newValue = value;
                }

                return {
                  tag: { ...oldState.tag, [field]: newValue },
                };
              })
            }
            attachedBeats={[]}
          />
          <EuiSpacer size="m" />
          <EuiFlexGroup>
            <EuiFlexItem grow={false}>
              <EuiButton
                fill
                disabled={
                  this.state.tag.id === '' // || this.state.tag.configuration_blocks.length === 0
                }
                onClick={this.saveTag}
              >
                Save
              </EuiButton>
            </EuiFlexItem>
            <EuiFlexItem grow={false}>
              <EuiButtonEmpty onClick={() => this.props.history.push('/overview/tags')}>
                Cancel
              </EuiButtonEmpty>
            </EuiFlexItem>
          </EuiFlexGroup>
        </div>
      </PrimaryLayout>
    );
  }
  private loadTag = async () => {
    const tags = await this.props.libs.tags.getTagsWithIds([this.props.match.params.tagid]);
    if (tags.length === 0) {
      // TODO do something to error
    }
    this.setState({
      tag: tags[0],
    });
  };
  private saveTag = async () => {
    await this.props.libs.tags.upsertTag(this.state.tag as ClientSideBeatTag);
    this.props.history.push('/overview/tags');
  };
}

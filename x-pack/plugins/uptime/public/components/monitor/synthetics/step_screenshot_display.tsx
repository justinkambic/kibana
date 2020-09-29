/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import {
  EuiFlexGroup,
  EuiFlexItem,
  EuiIcon,
  EuiLoadingSpinner,
  EuiOverlayMask,
  EuiPopover,
  EuiText,
} from '@elastic/eui';
import { i18n } from '@kbn/i18n';
import { FormattedMessage } from '@kbn/i18n/react';
import React, { useContext, useEffect, useRef, useState, FC } from 'react';
import { useIntersection } from 'react-use';
import { UptimeThemeContext } from '../../../contexts';

interface StepScreenshotDisplayProps {
  isLoading?: boolean;
  screenshot?: string;
  stepIndex?: number;
  fetchScreenshot: (stepIndex: number) => void;
  stepName?: string;
}

const THUMBNAIL_WIDTH = 320;
const THUMBNAIL_HEIGHT = 180;
const POPOVER_IMG_WIDTH = 640;
const POPOVER_IMG_HEIGHT = 360;

export const StepScreenshotDisplay: FC<StepScreenshotDisplayProps> = ({
  isLoading,
  screenshot,
  stepIndex,
  stepName,
  fetchScreenshot,
}) => {
  const containerRef = useRef(null);
  const {
    colors: { lightestShade: pageBackground },
  } = useContext(UptimeThemeContext);

  const [isImagePopoverOpen, setIsImagePopoverOpen] = useState<boolean>(false);
  const [isOverlayOpen, setIsOverlayOpen] = useState<boolean>(false);

  const intersection = useIntersection(containerRef, {
    root: null,
    rootMargin: '0px',
    threshold: 1,
  });

  useEffect(() => {
    if (
      screenshot === undefined &&
      stepIndex !== undefined &&
      intersection &&
      intersection.isIntersecting
    ) {
      fetchScreenshot(stepIndex);
    }
  }, [fetchScreenshot, intersection, screenshot, stepIndex]);

  let content: JSX.Element | null;
  if (screenshot) {
    const screenshotSrc = `data:image/jpeg;base64,${screenshot}`;
    content = (
      <>
        {isOverlayOpen && (
          <EuiOverlayMask onClick={() => setIsOverlayOpen(false)}>
            <input
              type="image"
              src={screenshotSrc}
              alt={
                stepName
                  ? i18n.translate(
                      'xpack.uptime.synthetics.screenshotDisplay.fullScreenshotAltText',
                      {
                        defaultMessage: 'Full screenshot for step with name {stepName}',
                        values: {
                          stepName,
                        },
                      }
                    )
                  : i18n.translate(
                      'xpack.uptime.synthetics.screenshotDisplay.fullScreenshotAltTextWithoutName',
                      {
                        defaultMessage: 'Full screenshot',
                      }
                    )
              }
              style={{ objectFit: 'contain' }}
              onClick={() => setIsOverlayOpen(false)}
            />
          </EuiOverlayMask>
        )}
        <EuiPopover
          anchorPosition="rightCenter"
          button={
            <input
              type="image"
              style={{
                width: THUMBNAIL_WIDTH,
                height: THUMBNAIL_HEIGHT,
                objectFit: 'cover',
                objectPosition: 'center top',
              }}
              src={screenshotSrc}
              alt={
                stepName
                  ? i18n.translate('xpack.uptime.synthetics.screenshotDisplay.altText', {
                      defaultMessage: 'Screenshot for step with name {stepName}',
                      values: {
                        stepName,
                      },
                    })
                  : i18n.translate('xpack.uptime.synthetics.screenshotDisplay.altTextWithoutName', {
                      defaultMessage: 'Screenshot',
                    })
              }
              onClick={() => setIsOverlayOpen(true)}
              onMouseEnter={() => setIsImagePopoverOpen(true)}
              onMouseLeave={() => setIsImagePopoverOpen(false)}
            />
          }
          closePopover={() => setIsImagePopoverOpen(false)}
          isOpen={isImagePopoverOpen}
        >
          <img
            alt={
              stepName
                ? i18n.translate('xpack.uptime.synthetics.screenshotDisplay.thumbnailAltText', {
                    defaultMessage: 'Thumbnail screenshot for step with name {stepName}',
                    values: {
                      stepName,
                    },
                  })
                : i18n.translate(
                    'xpack.uptime.synthetics.screenshotDisplay.thumbnailAltTextWithoutName',
                    {
                      defaultMessage: 'Thumbnail screenshot',
                    }
                  )
            }
            src={screenshotSrc}
            style={{ width: POPOVER_IMG_WIDTH, height: POPOVER_IMG_HEIGHT, objectFit: 'contain' }}
          />
        </EuiPopover>
      </>
    );
  } else if (isLoading === false && screenshot === '') {
    content = (
      <EuiFlexGroup alignItems="center" direction="column" style={{ paddingTop: '32px' }}>
        <EuiFlexItem grow={false}>
          <EuiIcon color="subdued" size="xxl" type="image" />
        </EuiFlexItem>
        <EuiFlexItem grow={false}>
          <EuiText>
            <strong>
              <FormattedMessage
                id="xpack.uptime.synthetics.screenshot.noImageMessage"
                defaultMessage="No image available"
              />
            </strong>
          </EuiText>
        </EuiFlexItem>
      </EuiFlexGroup>
    );
  } else if (isLoading === true) {
    content = <EuiLoadingSpinner size="xl" />;
  } else {
    content = null;
  }
  return (
    <div
      ref={containerRef}
      style={{ backgroundColor: pageBackground, height: THUMBNAIL_HEIGHT, width: THUMBNAIL_WIDTH }}
    >
      {content}
    </div>
  );
};

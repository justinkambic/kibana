/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { useCallback } from 'react';
import { useDeleteComment } from '../containers/use_delete_comment';
import { useUpdateAlertComment } from '../containers/use_update_alert_comment';

export function useStuff() {
  const { mutateAsync: deleteComment } = useDeleteComment();
  const { mutateAsync: updateComment } = useUpdateAlertComment();
  const ret = useCallback((caseId: string, alertId: string) => {
    
  }, []);
  const removeAlertsFromCase = () => {
    alerts.forEach((alert) => {
      if (caseData?.id && alertAttachment?.id && 'alertId' in alertAttachment) {
        const { alertId, index } = alertAttachment;
        if (Array.isArray(alertId) && Array.isArray(index) && alertId.length > 1) {
          const alertIdx = alertId.indexOf(alert._id);
          alertId.splice(alertIdx, 1);
          index.splice(alertIdx, 1);
          updateComment({
            caseId: caseData.id,
            commentUpdate: alertAttachment,
            successToasterTitle: removalSuccessToast,
          });
        } else {
          deleteComment({
            caseId: caseData.id,
            commentId: alertAttachment.id,
            successToasterTitle: removalSuccessToast,
          });
        }
        closeActionsPopover();
      }
    });
  };
}

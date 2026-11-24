import type { Application } from '../types';
import { getDocumentRequiredStage } from '../services/programFactory';

export const documentProgress = (application?: Application | null) => {
  const order = { application_stage: 0, erasmus_stage: 1, returned_home: 2 };
  const required = [
    ...new Set(
      (application?.program.checklist || [])
        .filter(
          item =>
            item.documentType !== 'extra' &&
            order[
              item.requiredStage || getDocumentRequiredStage(item.documentType)
            ] <= order[application?.status || 'application_stage'],
        )
        .flatMap(item =>
          item.documentType === 'boarding_pass'
            ? ['boarding_pass_outbound', 'boarding_pass_return']
            : [item.documentType],
        ),
    ),
  ];
  const current = (application?.documents || []).filter(
    doc => doc.isCurrent !== false,
  );
  const approved = required.filter(type =>
    current.some(doc => doc.type === type && doc.status === 'ok'),
  ).length;
  const uploaded = required.filter(type =>
    current.some(
      doc =>
        doc.type === type && !['missing', 'wrong_format'].includes(doc.status),
    ),
  ).length;
  return {
    total: required.length,
    approved,
    uploaded,
    missing: required.filter(
      type =>
        !current.some(
          doc =>
            doc.type === type &&
            !['missing', 'wrong_format'].includes(doc.status),
        ),
    ),
    awaitingOriginal: current.filter(
      doc => doc.physicalDeliveryStatus === 'awaiting_original',
    ).length,
  };
};

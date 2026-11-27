import { DOCUMENT_TYPES } from '../constants';
import type { AssignedProgram, Document, ProgramChecklistItem } from '../types';

// A slot is what a member uploads against: a fixed document type, or
// "extra:<key>" for a document the admin named in the program checklist.
export const itemSlot = (item: Pick<ProgramChecklistItem, 'documentType' | 'key'>) =>
  item.key ? `extra:${item.key}` : item.documentType;

export const documentSlot = (doc: Pick<Document, 'type' | 'requirementKey'>) =>
  doc.requirementKey ? `extra:${doc.requirementKey}` : doc.type;

export const parseSlot = (slot: string) =>
  slot.startsWith('extra:')
    ? { type: 'extra' as const, requirementKey: slot.slice(6) }
    : { type: slot as Document['type'], requirementKey: undefined };

export const slotLabel = (slot: string, program?: Pick<AssignedProgram, 'checklist'>) => {
  const { type, requirementKey } = parseSlot(slot);
  if (requirementKey)
    return (
      program?.checklist.find(item => item.key === requirementKey)?.label ||
      DOCUMENT_TYPES.extra
    );
  return DOCUMENT_TYPES[type as keyof typeof DOCUMENT_TYPES] || type;
};

export const documentLabel = (
  doc: Pick<Document, 'type' | 'requirementKey'>,
  program?: Pick<AssignedProgram, 'checklist'>,
) => slotLabel(documentSlot(doc), program);

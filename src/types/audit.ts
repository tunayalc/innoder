export type AuditAction =
  | 'USER_REGISTERED'
  | 'DOCUMENT_UPLOADED'
  | 'APPLICATION_SUBMITTED'
  | 'ADMIN_VERIFIED'
  | 'MESSAGE_SENT'
  | 'STATUS_CHANGED';

export interface AuditLog {
  id: string;
  action: AuditAction;
  userId: string;
  targetId: string;
  details?: string;
  timestamp: string;
}

export interface AuditState {
  logs: AuditLog[];
  isLoading: boolean;
  error: string | null;
}

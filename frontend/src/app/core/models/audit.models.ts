export interface AuditEntryDto {
  id: string;
  userId?: string;
  action: string;
  entityName: string;
  entityId: string;
  oldValuesJson?: string;
  newValuesJson?: string;
  changedColumnsJson?: string;
  timestampUtc: string;
  clientIpAddress?: string;
}

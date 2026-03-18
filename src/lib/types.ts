export type EntityId = 'writer' | 'checker' | 'cutter' | 'logger' | 'reader' | 'narrator';

export type OperationType = 'add' | 'remove' | 'flag' | 'annotate' | 'rewrite' | 'value';

export interface Operation {
  id: string;
  entity: EntityId;
  type: OperationType;
  timestamp: number;
  cycle: number;
  detail: string;
}

export interface Fragment {
  id: string;
  content: string;
  createdBy: EntityId;
  createdAt: number;
  cycle: number;
  operations: Operation[];
  alive: boolean;
  marks: Mark[];
}

export interface Mark {
  entity: EntityId;
  type: 'highlight' | 'flag' | 'label' | 'value-tag' | 'comment';
  color: string;
  content: string;
  timestamp: number;
}

export interface EntityState {
  id: EntityId;
  cycle: number;
  internalLog: string[];
  rules: Record<string, any>;
  vocabulary: string[];
}

export interface SystemState {
  cycle: number;
  document: Fragment[];
  entities: Record<EntityId, EntityState>;
  criteria: Criteria;
  log: LogEntry[];
  narrative: string[];
}

export interface Criteria {
  current: string[];
  history: { criteria: string[]; cycle: number }[];
}

export interface LogEntry {
  cycle: number;
  timestamp: number;
  entity: EntityId;
  action: string;
}

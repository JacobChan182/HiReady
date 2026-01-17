export type UserRole = 'employee' | 'trainer';

export type BehavioralCluster = 'high-replay' | 'fast-watcher' | 'note-taker' | 'late-night-learner' | 'steady-pacer';

export interface User {
  id: string;
  pseudonymId: string;
  role: UserRole;
  trainingProgramIds: string[];
  cluster?: BehavioralCluster;
  createdAt: Date;
}

export interface TrainingProgram {
  id: string;
  name: string;
  code: string;
  trainerId: string;
  trainingSessionIds: string[];
}

export interface Concept {
  id: string;
  name: string;
  summary: string;
  startTime: number;
  endTime: number;
  trainingSessionId: string;
}

export interface TrainingSession {
  id: string;
  title: string;
  trainingProgramId: string;
  videoUrl: string;
  duration: number;
  concepts: Concept[];
  uploadedAt: Date;
}

export type EventType = 'play' | 'pause' | 'replay' | 'seek' | 'rewind' | 'drop-off' | 'speed-change' | 'concept-jump';

export interface AnalyticsEvent {
  id: string;
  userId: string;
  trainingProgramId: string;
  trainingSessionId: string;
  conceptId?: string;
  eventType: EventType;
  timestamp: number;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

export interface ConceptInsight {
  conceptId: string;
  conceptName: string;
  replayCount: number;
  dropOffCount: number;
  avgWatchTime: number;
  struggleScore: number;
}

export interface ClusterInsight {
  cluster: BehavioralCluster;
  employeeCount: number;
  strugglingConcepts: string[];
  avgEngagement: number;
}

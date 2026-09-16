export type Priority = 'low' | 'medium' | 'high' | 'urgent';
export type ItemStatus = 'todo' | 'in-progress' | 'blocked' | 'done';

export interface OpenItem {
  id: string;
  title: string;
  description: string;
  status: ItemStatus;
  priority: Priority;
  owner: string;
  dueDate: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export type ADRStatus = 'proposed' | 'accepted' | 'rejected' | 'superseded';
export type ADRSubsystem = 'frontend' | 'backend' | 'devops' | 'strategy' | 'brand' | 'ai-agents';

export interface ADR {
  id: string;
  number: number;
  title: string;
  status: ADRStatus;
  subsystem: ADRSubsystem;
  context: string;
  decision: string;
  consequences: string;
  alternativesConsidered: string;
  author: string;
  createdAt: string;
  updatedAt: string;
}

export interface StrategicPillar {
  id: string;
  title: string;
  description: string;
  metrics: string;
  targetDate?: string;
}

export interface BrandAsset {
  id: string;
  name: string;
  type: 'logo' | 'guideline' | 'typography' | 'color' | 'other';
  driveUrl?: string;
  notes?: string;
}

export interface StrategyDoc {
  id: string;
  mission: string;
  vision: string;
  targetAudience: string;
  pillars: StrategicPillar[];
  brandGuidelines: {
    primaryColor: string;
    secondaryColor: string;
    accentColor: string;
    fontFamily: string;
    toneOfVoice: string;
    driveBrandKitUrl?: string;
  };
  brandAssets: BrandAsset[];
  updatedAt: string;
}

export type DeliverableType = 
  | 'google-doc' 
  | 'google-sheet' 
  | 'google-slide' 
  | 'drive-folder' 
  | 'agent-report' 
  | 'spec';

export interface Deliverable {
  id: string;
  title: string;
  summary: string;
  type: DeliverableType;
  driveUrl?: string;
  driveFileId?: string;
  author: string; // e.g. "Agent: Strategist-1" or "Mott (Product Lead)"
  authorType: 'user' | 'agent';
  tags: string[];
  markdownContent?: string;
  linkedItemId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ActivityEvent {
  id: string;
  timestamp: string;
  actor: {
    name: string;
    type: 'user' | 'agent' | 'system';
    avatar?: string;
  };
  action: string;
  details: string;
  category: 'item' | 'adr' | 'deliverable' | 'strategy' | 'system';
  link?: string;
}

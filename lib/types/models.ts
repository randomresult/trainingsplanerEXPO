export interface Club {
  documentId: string;
  Name: string;
}

export interface User {
  id: number;
  documentId?: string;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  clubs?: Club[];
  player?: Player | null;
  role?: { name?: string } | null;
}

export interface Exercise {
  documentId: string;
  Name: string;
  Description: string;
  Minutes: number;
  Steps?: string[];
  Hint?: string;
  Videos?: string[];
  Difficulty?: 'Anfänger' | 'Fortgeschritten' | 'Experte';
  focus?: Focus[];
}

export interface Focus {
  documentId: string;
  Name: string;
}

export interface Player {
  documentId: string;
  firstname: string;
  Name: string;
  email: string;
  requiresInviteAcceptance: boolean;
  Club?: Club | null;
}

export interface Training {
  documentId: string;
  Name: string;
  Date: string;
  createdAt?: string;
  training_status: 'draft' | 'in_progress' | 'completed';
  startedAt?: string;
  completedAt?: string;
  actualDuration?: number;
  exercises: Exercise[];
  players: Player[];
}

export interface PlayerProgress {
  documentId: string;
  Points: number;
  player: Player;
  exercise: Exercise;
  training: Training;
}

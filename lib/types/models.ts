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

export interface MethodicalSeriesRef {
  documentId: string;
  name: string;
}

export interface Exercise {
  documentId: string;
  Name: string;
  Description: string;
  Minutes: number;
  Steps?: string[];
  Hint?: string;
  Videos?: string[];
  focusareas?: Tag[];
  playerlevels?: Tag[];
  categories?: Tag[];
  methodicalSeries?: MethodicalSeriesRef[];
}

// Strapi relations (focusareas, playerlevels, categories) all share the
// same shape — documentId + human-readable Name. One common type keeps
// the ExerciseCard pill rendering uniform.
export interface Tag {
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

export interface MethodicalSeries {
  documentId: string;
  name: string;
  description?: string;
  goal?: string;
  category?: string;
  exercises: Exercise[];
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
  exercises: Exercise[];               // ALL exercises — MÜR and standalone
  methodicalSeries: MethodicalSeriesRef[]; // grouping only, no exercises populated
  players: Player[];
}

export interface PlayerProgress {
  documentId: string;
  Points: number;
  player: Player;
  exercise: Exercise;
  training: Training;
}

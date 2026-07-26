export type SimPhase = 'growing' | 'peak' | 'stalling' | 'collapsed';

export interface HenPackage {
  id: string;
  name: string;
  tier: 'basic' | 'silver' | 'gold' | 'platinum';
  virtualPrice: number;
  eggsPerDay: number;
  lifespanDays: number;
  totalReturn: number;
}

export interface Investment {
  id: string;
  packageId: string;
  packageName: string;
  tier: string;
  purchasedAt: string;
  expiresAt: string;
  eggsPerDay: number;
  lifespanDays: number;
  eggsCollectedTotal: number;
  status: 'active' | 'expired';
}

export interface Transaction {
  id: string;
  type: 'deposit' | 'withdrawal' | 'egg-income' | 'purchase';
  amount: number;
  balanceAfter: number;
  description: string;
  createdAt: string;
}

export interface AppNotification {
  id: string;
  type: 'egg' | 'investor' | 'educational' | 'warning';
  message: string;
  read: boolean;
  createdAt: string;
}

export interface SimState {
  phase: SimPhase;
  simulationDay: number;
  investorCount: number;
  phaseStartedAt: string;
}

export interface User {
  name: string;
  email: string;
  createdAt: string;
}

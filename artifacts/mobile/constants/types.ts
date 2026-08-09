// Referral reward activity only - the app never holds or moves money.
export interface ReferralActivity {
  id?: string;
  _id?: string;
  type: 'referral-egg-bonus' | 'hen-egg-yield';
  quantity: number;
  description: string;
  createdAt: string;
}

export interface AppNotification {
  id: string;
  type: 'order' | 'referral' | 'warning';
  message: string;
  read: boolean;
  createdAt: string;
}

export interface User {
  id?: string;
  _id?: string;
  name: string;
  email: string;
  phone?: string;
  createdAt: string;
}

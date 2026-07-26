import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  User, 
  Investment, 
  Transaction, 
  AppNotification, 
  SimState, 
  HenPackage,
  SimPhase
} from '@/constants/types';
import { generateId, getDateString } from '@/constants/helpers';

export const HEN_PACKAGES: HenPackage[] = [
  { 
    id: 'basic', 
    name: 'Basic Hen', 
    tier: 'basic', 
    virtualPrice: 500, 
    eggsPerDay: 10, 
    lifespanDays: 30, 
    totalReturn: 300 
  },
  { 
    id: 'silver', 
    name: 'Silver Hen', 
    tier: 'silver', 
    virtualPrice: 2000, 
    eggsPerDay: 45, 
    lifespanDays: 45, 
    totalReturn: 2025 
  },
  { 
    id: 'gold', 
    name: 'Gold Hen', 
    tier: 'gold', 
    virtualPrice: 5000, 
    eggsPerDay: 120, 
    lifespanDays: 60, 
    totalReturn: 7200 
  },
  { 
    id: 'platinum', 
    name: 'Platinum Hen', 
    tier: 'platinum', 
    virtualPrice: 10000, 
    eggsPerDay: 260, 
    lifespanDays: 90, 
    totalReturn: 23400 
  },
];

interface SimulationContextType {
  user: User | null;
  virtualBalance: number;
  totalInvestment: number;
  investments: Investment[];
  transactions: Transaction[];
  notifications: AppNotification[];
  simState: SimState;
  unreadCount: number;
  
  login: (name: string, email: string) => Promise<void>;
  logout: () => Promise<void>;
  
  buyHen: (pkg: HenPackage) => void;
  
  deposit: (amount: number) => void;
  withdraw: (amount: number) => void;
  
  canCollectToday: boolean;
  dailyEggIncome: number;
  collectEggs: () => void;
  
  markNotificationRead: (id: string) => void;
  markAllRead: () => void;
  
  resetSimulation: () => void;
  
  isLoaded: boolean;
}

const SimulationContext = createContext<SimulationContextType | undefined>(undefined);

export function SimulationProvider({ children }: { children: React.ReactNode }) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [virtualBalance, setVirtualBalance] = useState(0);
  const [totalInvestment, setTotalInvestment] = useState(0);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [simState, setSimState] = useState<SimState>({
    phase: 'growing',
    simulationDay: 0,
    investorCount: 847,
    phaseStartedAt: new Date().toISOString(),
  });
  const [lastCollect, setLastCollect] = useState<string>('');

  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Load data
  useEffect(() => {
    (async () => {
      try {
        const [
          userStr,
          balanceStr,
          investmentsStr,
          transactionsStr,
          notificationsStr,
          simStateStr,
          lastCollectStr,
        ] = await Promise.all([
          AsyncStorage.getItem('@henapp/user'),
          AsyncStorage.getItem('@henapp/balance'),
          AsyncStorage.getItem('@henapp/investments'),
          AsyncStorage.getItem('@henapp/transactions'),
          AsyncStorage.getItem('@henapp/notifications'),
          AsyncStorage.getItem('@henapp/simstate'),
          AsyncStorage.getItem('@henapp/lastcollect'),
        ]);

        if (userStr) setUser(JSON.parse(userStr));
        if (balanceStr) setVirtualBalance(JSON.parse(balanceStr));
        if (investmentsStr) setInvestments(JSON.parse(investmentsStr));
        if (transactionsStr) setTransactions(JSON.parse(transactionsStr));
        if (notificationsStr) setNotifications(JSON.parse(notificationsStr));
        if (simStateStr) setSimState(JSON.parse(simStateStr));
        if (lastCollectStr) setLastCollect(lastCollectStr);
      } catch (err) {
        console.error('Load error:', err);
      } finally {
        setIsLoaded(true);
      }
    })();
  }, []);

  // Persist user
  useEffect(() => {
    if (isLoaded) {
      if (user) {
        AsyncStorage.setItem('@henapp/user', JSON.stringify(user));
      } else {
        AsyncStorage.removeItem('@henapp/user');
      }
    }
  }, [user, isLoaded]);

  // Persist balance
  useEffect(() => {
    if (isLoaded) {
      AsyncStorage.setItem('@henapp/balance', JSON.stringify(virtualBalance));
    }
  }, [virtualBalance, isLoaded]);

  // Persist investments
  useEffect(() => {
    if (isLoaded) {
      AsyncStorage.setItem('@henapp/investments', JSON.stringify(investments));
      const total = investments.reduce((sum, inv) => {
        const pkg = HEN_PACKAGES.find(p => p.id === inv.packageId);
        return sum + (pkg?.virtualPrice || 0);
      }, 0);
      setTotalInvestment(total);
    }
  }, [investments, isLoaded]);

  // Persist transactions
  useEffect(() => {
    if (isLoaded) {
      AsyncStorage.setItem('@henapp/transactions', JSON.stringify(transactions));
    }
  }, [transactions, isLoaded]);

  // Persist notifications
  useEffect(() => {
    if (isLoaded) {
      AsyncStorage.setItem('@henapp/notifications', JSON.stringify(notifications));
    }
  }, [notifications, isLoaded]);

  // Persist simState
  useEffect(() => {
    if (isLoaded) {
      AsyncStorage.setItem('@henapp/simstate', JSON.stringify(simState));
    }
  }, [simState, isLoaded]);

  // Persist lastCollect
  useEffect(() => {
    if (isLoaded && lastCollect) {
      AsyncStorage.setItem('@henapp/lastcollect', lastCollect);
    }
  }, [lastCollect, isLoaded]);

  // Simulation ticker (3 seconds = 1 day)
  useEffect(() => {
    if (!isLoaded || !user) return;

    intervalRef.current = setInterval(() => {
      setSimState(prev => {
        const newDay = prev.simulationDay + 1;
        let newPhase: SimPhase = prev.phase;
        let newInvestorCount = prev.investorCount;
        let phaseStartedAt = prev.phaseStartedAt;

        // Phase transitions
        if (newDay >= 0 && newDay <= 5) {
          newPhase = 'growing';
          newInvestorCount = Math.floor(prev.investorCount * (1 + (0.12 + Math.random() * 0.06)));
        } else if (newDay >= 6 && newDay <= 10) {
          if (prev.phase !== 'peak') {
            phaseStartedAt = new Date().toISOString();
            addNotification({
              type: 'educational',
              message: 'Peak phase: Investor growth is slowing. This is typical as Ponzi schemes struggle to find new recruits.',
            });
          }
          newPhase = 'peak';
          newInvestorCount = Math.floor(prev.investorCount * (1 + (0.03 + Math.random() * 0.03)));
        } else if (newDay >= 11 && newDay <= 15) {
          if (prev.phase !== 'stalling') {
            phaseStartedAt = new Date().toISOString();
            addNotification({
              type: 'warning',
              message: 'Stalling phase: New investor growth has nearly stopped. The scheme is running out of money.',
            });
          }
          newPhase = 'stalling';
          newInvestorCount = Math.floor(prev.investorCount * (1 + Math.random() * 0.01));
        } else if (newDay >= 16) {
          if (prev.phase !== 'collapsed') {
            phaseStartedAt = new Date().toISOString();
            addNotification({
              type: 'warning',
              message: 'SCHEME COLLAPSED! No new investors means no money to pay existing ones. This is how all Ponzi schemes end.',
            });
          }
          newPhase = 'collapsed';
        }

        // Egg income notification (but don't auto-credit)
        if (newPhase !== 'collapsed') {
          const activeInvs = investments.filter(inv => inv.status === 'active' && new Date(inv.expiresAt) > new Date());
          if (activeInvs.length > 0) {
            const dailyEggs = activeInvs.reduce((sum, inv) => sum + inv.eggsPerDay, 0);
            addNotification({
              type: 'egg',
              message: `Your hens produced ${dailyEggs} virtual eggs today. Tap "Collect Eggs" to claim them.`,
            });
          }
        }

        return {
          phase: newPhase,
          simulationDay: newDay,
          investorCount: newInvestorCount,
          phaseStartedAt,
        };
      });

      // Mark expired investments
      setInvestments(prev => prev.map(inv => {
        if (inv.status === 'active' && new Date(inv.expiresAt) <= new Date()) {
          return { ...inv, status: 'expired' as const };
        }
        return inv;
      }));
    }, 3000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isLoaded, user, investments]);

  const addNotification = useCallback((notif: Omit<AppNotification, 'id' | 'read' | 'createdAt'>) => {
    const newNotif: AppNotification = {
      ...notif,
      id: generateId(),
      read: false,
      createdAt: new Date().toISOString(),
    };
    setNotifications(prev => [newNotif, ...prev]);
  }, []);

  const addTransaction = useCallback((tx: Omit<Transaction, 'id' | 'createdAt' | 'balanceAfter'>) => {
    setVirtualBalance(prev => {
      const newBalance = prev + tx.amount;
      const newTx: Transaction = {
        ...tx,
        id: generateId(),
        balanceAfter: newBalance,
        createdAt: new Date().toISOString(),
      };
      setTransactions(prevTx => [newTx, ...prevTx]);
      return newBalance;
    });
  }, []);

  const login = useCallback(async (name: string, email: string) => {
    const newUser: User = {
      name,
      email,
      createdAt: new Date().toISOString(),
    };
    setUser(newUser);
    setVirtualBalance(1000);
    addTransaction({
      type: 'deposit',
      amount: 1000,
      description: 'Welcome bonus - Virtual coins',
    });
    addNotification({
      type: 'educational',
      message: 'Welcome! You received 1000 virtual coins to start learning. Remember: this is a simulation.',
    });
  }, [addTransaction, addNotification]);

  const logout = useCallback(async () => {
    await AsyncStorage.multiRemove([
      '@henapp/user',
      '@henapp/balance',
      '@henapp/investments',
      '@henapp/transactions',
      '@henapp/notifications',
      '@henapp/simstate',
      '@henapp/lastcollect',
    ]);
    setUser(null);
    setVirtualBalance(0);
    setTotalInvestment(0);
    setInvestments([]);
    setTransactions([]);
    setNotifications([]);
    setSimState({
      phase: 'growing',
      simulationDay: 0,
      investorCount: 847,
      phaseStartedAt: new Date().toISOString(),
    });
    setLastCollect('');
  }, []);

  const buyHen = useCallback((pkg: HenPackage) => {
    if (virtualBalance < pkg.virtualPrice) return;
    if (simState.phase === 'collapsed') return;

    const now = new Date();
    const expiresAt = new Date(now.getTime() + pkg.lifespanDays * 24 * 60 * 60 * 1000);

    const newInv: Investment = {
      id: generateId(),
      packageId: pkg.id,
      packageName: pkg.name,
      tier: pkg.tier,
      purchasedAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
      eggsPerDay: pkg.eggsPerDay,
      lifespanDays: pkg.lifespanDays,
      eggsCollectedTotal: 0,
      status: 'active',
    };

    setInvestments(prev => [...prev, newInv]);
    addTransaction({
      type: 'purchase',
      amount: -pkg.virtualPrice,
      description: `Purchased ${pkg.name}`,
    });
    addNotification({
      type: 'investor',
      message: `Congratulations! You bought a ${pkg.name}. It will produce ${pkg.eggsPerDay} eggs/day for ${pkg.lifespanDays} days.`,
    });
  }, [virtualBalance, simState.phase, addTransaction, addNotification]);

  const deposit = useCallback((amount: number) => {
    addTransaction({
      type: 'deposit',
      amount,
      description: `Virtual deposit of ${amount} coins`,
    });
  }, [addTransaction]);

  const withdraw = useCallback((amount: number) => {
    if (simState.phase === 'collapsed') {
      addNotification({
        type: 'warning',
        message: 'Withdrawal failed: The scheme has collapsed. No payouts are possible.',
      });
      return;
    }
    if (amount > virtualBalance) {
      addNotification({
        type: 'warning',
        message: 'Insufficient virtual balance.',
      });
      return;
    }
    addTransaction({
      type: 'withdrawal',
      amount: -amount,
      description: `Virtual withdrawal of ${amount} coins`,
    });
  }, [virtualBalance, simState.phase, addTransaction, addNotification]);

  const dailyEggIncome = investments
    .filter(inv => inv.status === 'active' && new Date(inv.expiresAt) > new Date())
    .reduce((sum, inv) => sum + inv.eggsPerDay, 0);

  const canCollectToday = lastCollect !== getDateString(new Date());

  const collectEggs = useCallback(() => {
    if (!canCollectToday) return;
    if (dailyEggIncome === 0) return;

    setLastCollect(getDateString(new Date()));
    addTransaction({
      type: 'egg-income',
      amount: dailyEggIncome,
      description: `Collected ${dailyEggIncome} virtual eggs`,
    });
    
    setInvestments(prev => prev.map(inv => {
      if (inv.status === 'active' && new Date(inv.expiresAt) > new Date()) {
        return { ...inv, eggsCollectedTotal: inv.eggsCollectedTotal + inv.eggsPerDay };
      }
      return inv;
    }));
  }, [canCollectToday, dailyEggIncome, addTransaction]);

  const markNotificationRead = useCallback((id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  }, []);

  const markAllRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, []);

  const resetSimulation = useCallback(() => {
    setVirtualBalance(1000);
    setTotalInvestment(0);
    setInvestments([]);
    setTransactions([{
      id: generateId(),
      type: 'deposit',
      amount: 1000,
      balanceAfter: 1000,
      description: 'Simulation reset - Welcome bonus',
      createdAt: new Date().toISOString(),
    }]);
    setNotifications([{
      id: generateId(),
      type: 'educational',
      message: 'Simulation reset. You can now explore the cycle again.',
      read: false,
      createdAt: new Date().toISOString(),
    }]);
    setSimState({
      phase: 'growing',
      simulationDay: 0,
      investorCount: 847,
      phaseStartedAt: new Date().toISOString(),
    });
    setLastCollect('');
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <SimulationContext.Provider
      value={{
        user,
        virtualBalance,
        totalInvestment,
        investments,
        transactions,
        notifications,
        simState,
        unreadCount,
        login,
        logout,
        buyHen,
        deposit,
        withdraw,
        canCollectToday,
        dailyEggIncome,
        collectEggs,
        markNotificationRead,
        markAllRead,
        resetSimulation,
        isLoaded,
      }}
    >
      {children}
    </SimulationContext.Provider>
  );
}

export function useSimulation() {
  const context = useContext(SimulationContext);
  if (!context) throw new Error('useSimulation must be used within SimulationProvider');
  return context;
}

# Hen & Egg Farm Simulator

An educational fintech-style mobile app that teaches users how Ponzi schemes work through a fictional hen/egg investment simulation. No real money involved — everything is virtual and clearly labeled.

## Run & Operate

- `pnpm --filter @workspace/mobile run dev` — run the Expo mobile app
- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Mobile: Expo (SDK 54) + Expo Router (file-based routing)
- State: React Context + AsyncStorage (no backend needed)
- Animations: react-native-reanimated
- Charts: react-native-svg (custom View/SVG charts)
- Icons: @expo/vector-icons (Ionicons, Feather, MaterialCommunityIcons)
- API: Express 5 (unused for mobile — all state is local)

## Where things live

- `artifacts/mobile/app/` — Expo Router screens
- `artifacts/mobile/app/(auth)/` — login, register, OTP screens
- `artifacts/mobile/app/(tabs)/` — 5 main tabs: Home, Farm, Wallet, Learn, Charts
- `artifacts/mobile/app/learn/flow.tsx` — 8-step educational Ponzi flow
- `artifacts/mobile/app/notifications.tsx` — notifications list
- `artifacts/mobile/app/summary.tsx` — collapse / final warning screen
- `artifacts/mobile/contexts/SimulationContext.tsx` — all game state + AsyncStorage persistence
- `artifacts/mobile/constants/types.ts` — TypeScript interfaces
- `artifacts/mobile/constants/colors.ts` — design tokens (green farm palette)
- `artifacts/mobile/components/` — SimBadge, StatCard, HenCard, TransactionRow, InvestmentRow

## Architecture decisions

- **Frontend-only**: All state in AsyncStorage via SimulationContext. No backend required for the simulation.
- **Simulation ticker**: setInterval every 3 seconds = 1 simulated day. Phases: growing (0-5d) → peak (6-10d) → stalling (11-15d) → collapsed (16d+).
- **No real money**: Payment method buttons (JazzCash/Easypaisa/Card) exist only as greyed-out Demo elements with alerts.
- **SIMULATION ONLY badge**: Present on every screen that shows financial data, non-dismissible.

## Product

- Users register and receive 1,000 virtual coins
- They buy virtual hens (Basic/Silver/Gold/Platinum) with different ROI tiers
- Daily egg income accumulates; users tap "Collect Eggs" once per simulated day
- The simulation auto-advances through phases showing realistic Ponzi collapse
- An 8-step guided educational flow explains the Ponzi mechanics step-by-step
- Charts show egg production, investor growth, collapse timeline, and cash flow

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- The simulation ticker only runs when user is logged in (checks `user` in context)
- IDs use `Date.now().toString() + Math.random().toString(36).substr(2, 9)` — no uuid package
- The root `app/index.tsx` handles auth redirect (no Redirect inside Stack without container)

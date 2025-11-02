# Minimal Trading App

A lightweight, offline-first mobile trading application built with React Native and Expo.

## Features

- Portfolio tracking with real-time updates (mock data by default)
- Watchlist management
- Trading bot UI (read-only with mock data)
- Dark/Light theme support
- Multi-language support (EN/FR)
- Offline-first architecture

## Quick Start

### Prerequisites

- Node.js 20.19.4+
- Supabase account (optional for local development)

### Installation

```bash
# Install dependencies
npm install

# Copy environment template
cp .env.local.example .env

# Configure your Supabase credentials in .env (optional)
# If not configured, app will run in full offline mode

# Run the app
npm run dev
```

### Database Setup (Optional)

If you want to persist data:

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Run the schema: `supabase/init.sql` in your Supabase SQL editor
3. Copy your project URL and anon key to `.env`:
   ```
   SUPABASE_URL=your_project_url
   SUPABASE_ANON_KEY=your_anon_key
   ```

## Configuration

### Environment Variables

See `.env.local.example` for all available options.

### Mock vs Live Data

By default, the app uses mock data for all market information. To enable live market data:

```env
ENABLE_LIVE_MARKET=true
MARKET_PROVIDER=finnhub
FINNHUB_API_KEY=your_api_key
```

### Feature Flags

- `APP_ENV=local` - Run in local/offline mode (default)
- `ENABLE_TRADING_BOT_UI=true` - Show trading bot screens (default: true)
- `ENABLE_LIVE_MARKET=false` - Use mock market data (default: false)
- `ENABLE_REALTIME_WS=false` - Disable WebSocket updates (default: false)

## Project Structure

```
├── app/                    # Expo Router screens
│   ├── (auth)/            # Authentication screens
│   └── (tabs)/            # Main app tabs
├── components/            # React components
│   ├── glass/            # Glass morphism UI
│   ├── dashboard/        # Dashboard widgets
│   ├── modals/           # Modal dialogs
│   └── ui/               # Base UI components
├── services/              # Business logic
│   ├── marketData/        # Market data providers
│   │   └── providers/    # Mock & real providers
│   └── trading/           # Trading services
├── lib/                   # Core utilities
│   ├── logger.ts         # Simple logging
│   └── supabase.ts       # Database client
├── config/                # App configuration
│   └── env.ts            # Environment config
├── hooks/                 # Custom React hooks
├── stores/                # Zustand state management
├── constants/             # App constants
└── supabase/              # Database schema
    └── init.sql          # Complete schema
```

## Development

```bash
# Type checking
npm run typecheck

# Linting
npm run lint

# Build for web
npm run build:web
```

## Mock Services

The app includes fully functional mock services that simulate:

- Real-time stock prices with realistic volatility
- Historical price data (candlesticks)
- Trading bot performance metrics
- Trade execution and history

All mock services implement the same interface as real providers, making it easy to swap implementations.

## Architecture

### Offline-First Design

- App works fully without internet connection
- Mock data providers ensure all features are functional
- Optional real API integration via feature flags
- Graceful fallback to mock data on API failures

### Service Layer

All external integrations go through a service layer:

```typescript
// services/marketData/index.ts
import { useMockData } from '@/config/env';
import mockProvider from './providers/mock';

// Automatically uses mock provider in local mode
const provider = useMockData ? mockProvider : realProvider;
```

### State Management

- Zustand for global state
- React Context for authentication and themes
- Async Storage for local persistence

## Adding Live Market Data

To integrate a real market data provider:

1. Create provider in `services/marketData/providers/`
2. Implement the `MarketDataProvider` interface
3. Add provider to service selector
4. Configure API key in environment

Example provider interface:

```typescript
interface MarketDataProvider {
  name: string;
  isAvailable(): boolean;
  getQuote(symbol: string): Promise<Quote>;
  getCandles(symbol: string, range: string): Promise<Candle[]>;
  subscribe?(symbols: string[], onTick: Function): () => void;
}
```

## License

Proprietary - All rights reserved

## Support

For issues and questions, open an issue in the repository.

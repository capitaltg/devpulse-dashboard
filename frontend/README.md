# Frontend Quick Start

## Setup

1. Install dependencies:

```bash
npm ci
```

2. Start the Vite dev server:

```bash
npm run dev
```

The app runs on `http://localhost:3000` by default.

## Backend Proxy (`DEV_PROXY`)

The frontend proxies `/v1` API calls through Vite. By default it targets:

- `http://localhost:8000`

To run the frontend against a deployed backend, set `DEV_PROXY` before starting the dev server.

Example:

```bash
DEV_PROXY=https://ghdashboard.capitaltg.com npm run dev
```

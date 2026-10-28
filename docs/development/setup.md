# Development Setup

Guide for setting up and running the OOSC monorepo locally.

## Prerequisites

- **Node.js**: $\ge 20.0.0$
- **pnpm**: $\ge 9.0.0$ (or Corepack)
- **Turbo**: Monorepo build system

## Initial Setup

```bash
# Clone the repository
git clone https://github.com/ashutosh-tanguria/OOSC.git
cd OOSC

# Install dependencies
pnpm install

# Setup environment
cp .env.example .env
```

## Running the Services

```bash
# Run API, Web, and services concurrently:
pnpm dev

# Or run services individually:
pnpm --filter @oosc/api dev   # API on http://localhost:4000
pnpm --filter @oosc/web dev   # Web UI on http://localhost:3000
pnpm mock-agent               # Mock Agent on http://127.0.0.1:5000/mock-agent
```

## Running Tests

```bash
pnpm --filter @oosc/api test
```

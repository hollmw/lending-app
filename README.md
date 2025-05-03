**Project Setup and Usage**

> This guide will help you start and test the entire project, including the blockchain node, frontend server, and oracle service.

---

## Prerequisites

- **Node.js** (v16+)
- **npm** (v8+)

## Directory Structure

```text
├── blockchain/    # Hardhat blockchain node and smart contracts
├── frontend/      # React/Vue/Next.js frontend application
└── oracle/        # Off-chain oracle service and tests
```

# Install blockchain dependencies
cd blockchain
npm install
# Install frontend dependencies
cd ../frontend
npm install
# Install oracle dependencies
cd ../oracle
npm install


# Start Project
```bash
cd blockchain
npm run start

cd frontend
npm run dev

cd oracle
npm run start
```

# Run Tests (from root)
```bash
npm run test
```
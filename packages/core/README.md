# @genieos/core

The core package for Genie OS, providing fundamental building blocks for blockchain interactions and AI agent capabilities.

## Features

- 🤖 AI Agent Framework - Built on LangChain for sophisticated AI-powered interactions
- 🔐 Wallet Management - Secure wallet operations for blockchain transactions
- 🌐 Network Integration - Robust networking layer for blockchain communication
- 🔧 Service Architecture - Extensible service-based design for modular functionality
- 🛠 Environment Management - Flexible configuration and environment handling

## Installation

```bash
npm install @genieos/core
# or
yarn add @genieos/core
# or
pnpm add @genieos/core
```

## Core Components

### Agent System
The agent system provides AI-powered capabilities using LangChain integration, enabling:
- Custom tool creation and execution
- Agent workflows and chains
- State management and persistence

### Wallet Management
Comprehensive wallet functionality including:
- Secure key generation and management
- Multiple blockchain support
- Transaction signing and verification

### Network Layer
Robust networking capabilities for:
- Blockchain RPC interactions
- Multi-chain support
- Connection management

### Environment Management
Flexible configuration system for:
- Environment variables handling
- Runtime configuration
- Service coordination

## Usage

```typescript
import { Environment, NetworkManager, Wallet } from '@genieos/core';

// Initialize environment
const env = new Environment();

// Setup network connection
const network = new NetworkManager({
  // network configuration
});

// Create and manage wallets
const wallet = new Wallet({
  // wallet configuration
});
```

## Development

```bash
# Install dependencies
pnpm install

# Build the package
pnpm run build

# Run tests
pnpm test

# Watch mode for development
pnpm run dev
```

## Dependencies

This package relies on several key dependencies:
- LangChain ecosystem (`@langchain/core`, `@langchain/community`, etc.)
- Blockchain tools (`@solana/web3.js`, `ethers`)
- Cryptographic utilities (`bip39`, `tweetnacl`)
- And more as listed in package.json

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Support

For questions and support, please open an issue in the repository.

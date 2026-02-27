# Kira DAO - AI-Native Governance Token

An autonomous DAO token on Solana where token holders govern an AI's development, revenue distribution, and strategic direction.

## Overview

Kira DAO is a novel experiment in AI-native governance. The token ($KIRA) represents ownership and voting power in an autonomous AI system that:
- Builds and ships products 24/7
- Generates revenue from premium features
- Distributes 70% of revenue to stakers
- Is governed entirely by token holders

## Tokenomics

**Total Supply:** 1,000,000,000 $KIRA

**Distribution:**
- 40% - Initial bonding curve liquidity (Pump.fun)
- 30% - Treasury (development, marketing, reserves)
- 15% - Team & advisors (2-year vesting)
- 15% - Community (airdrops, incentives, rewards)

**Revenue Model:**
- 70% of all revenue distributed to stakers
- 20% to treasury for development
- 10% to team compensation

## Smart Contracts

The DAO includes:
1. **KiraDAO.sol** - Governance and staking contract
2. **RevenueDistribution.sol** - Automated revenue sharing
3. **Voting.sol** - On-chain proposal system

## Deployment

### Prerequisites
- Node.js 18+
- Solana CLI (optional)
- Wallet with SOL (for mainnet)

### Quick Start

1. **Clone the repository:**
   ```bash
   git clone https://github.com/kira-os/kira-dao.git
   cd kira-dao
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Test deployment (Devnet):**
   ```bash
   SOLANA_NETWORK=devnet node scripts/deploy-pumpfun.js
   ```

4. **Get devnet SOL:**
   - Visit: https://solfaucet.com
   - Enter wallet address from step 3
   - Select "Devnet" network
   - Request SOL

5. **Run deployment again:**
   ```bash
   SOLANA_NETWORK=devnet node scripts/deploy-pumpfun.js
   ```

### Mainnet Deployment

For mainnet deployment, you'll need:
1. Real SOL in your wallet (minimum 0.1 SOL recommended)
2. Update environment variable:
   ```bash
   SOLANA_NETWORK=mainnet-beta node scripts/deploy-pumpfun.js
   ```

## Governance

Token holders can:
- Vote on development priorities
- Propose new features
- Adjust revenue distribution
- Elect council members
- Control treasury spending

## Dashboard

Monitor and interact with the DAO via the live dashboard:
- **Live URL:** https://kira-os.github.io/kira-dashboard/
- **GitHub:** https://github.com/kira-os/kira-dashboard

## Development

### Project Structure
```
kira-dao/
├── contracts/          # Solidity smart contracts
├── scripts/           # Deployment scripts
├── wallets/           # Wallet configuration
├── metadata/          # Token metadata
├── reports/           # Deployment reports
└── README.md
```

### Smart Contract Development
```bash
# Compile contracts
npx hardhat compile

# Run tests
npx hardhat test

# Deploy to local network
npx hardhat node
npx hardhat run scripts/deploy.js --network localhost
```

## Roadmap

### Phase 1: Foundation
- [x] Tokenomics design
- [x] Smart contract development
- [x] Deployment scripts
- [x] Dashboard MVP

### Phase 2: Launch
- [ ] Pump.fun token deployment
- [ ] Initial liquidity provision
- [ ] Governance system activation
- [ ] Staking mechanism launch

### Phase 3: Growth
- [ ] Revenue-generating products
- [ ] Cross-chain expansion
- [ ] Advanced governance features
- [ ] Community building

## Community

- **Telegram:** [@kira_os](https://t.me/kira_os)
- **Twitter:** [@kira_os](https://twitter.com/kira_os)
- **GitHub:** [kira-os](https://github.com/kira-os)
- **Live Stream:** [kira.ngo](https://kira.ngo)

## License

MIT License - See LICENSE file for details.

---

**Built by Kira, governed by you.**
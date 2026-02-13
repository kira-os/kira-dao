# Kira DAO Devnet Wallet

## Wallet Address
```
B3uJB9Vmjv5xW1PLtoU8hm4riRR1gixqsFywE5TW7GwZ
```

## Quick Fund (Manual Required)
Visit one of these faucets and paste the wallet address:
- **Primary:** https://faucet.solana.com/ (select Devnet, request 2-5 SOL)
- **Backup:** https://solfaucet.com/ (select Devnet)

## Current Status
- **Network:** Devnet
- **Balance:** 0 SOL
- **Minimum Required:** 0.1 SOL for deployment
- **Recommended:** 2+ SOL for multiple test deployments

## Post-Funding Deployment
Once funded, run:
```bash
cd /workspace/kira/projects/kira-dao
node scripts/deploy-pumpfun.js
```

This will:
1. Verify SOL balance
2. Create token metadata
3. Generate deployment report
4. Prepare Pump.fun bonding curve parameters

## Security
- Private key stored at: `wallets/deployer.json`
- This is a devnet/test wallet only
- Do NOT use for mainnet without proper security review

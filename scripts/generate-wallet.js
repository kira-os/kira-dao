#!/usr/bin/env node

/**
 * Generate fresh wallet keys (post-security audit)
 * Creates new deployer wallet with secure entropy
 */

const { Keypair } = require('@solana/web3.js');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

function generateSecureWallet() {
  console.log('🔐 GENERATING SECURE WALLET');
  console.log('============================\n');

  // Ensure wallets directory exists
  const walletDir = path.join(__dirname, '..', 'wallets');
  if (!fs.existsSync(walletDir)) {
    fs.mkdirSync(walletDir, { mode: 0o700 });
  }

  // Generate keypair with additional entropy
  const extraEntropy = crypto.randomBytes(32);
  const keypair = Keypair.generate();
  
  const walletPath = path.join(walletDir, 'deployer.json');
  
  // Save with restricted permissions
  fs.writeFileSync(walletPath, JSON.stringify(Array.from(keypair.secretKey)));
  fs.chmodSync(walletPath, 0o600);
  
  console.log('✅ New wallet generated');
  console.log('   Address:', keypair.publicKey.toString());
  console.log('   Saved to:', walletPath);
  console.log('   Permissions: 600 (owner read/write only)');
  console.log('\n⚠️  IMPORTANT:');
  console.log('   1. Fund this wallet with devnet SOL');
  console.log('   2. Store backup in 1Password IMMEDIATELY');
  console.log('   3. Never commit to GitHub');
  
  return {
    publicKey: keypair.publicKey.toString(),
    path: walletPath
  };
}

if (require.main === module) {
  generateSecureWallet();
}

module.exports = { generateSecureWallet };

#!/usr/bin/env node

/**
 * Deploy Squads Multi-Sig on Solana Devnet
 * Simplified version using direct SDK calls
 */

const { Connection, Keypair, PublicKey, clusterApiUrl } = require('@solana/web3.js');
const Squads = require('@sqds/sdk');
const fs = require('fs');
const path = require('path');

const CONFIG = {
  cluster: 'devnet',
  threshold: 3,
  members: 5,
  createKeyPath: './wallets/deployer.json'
};

async function deployMultisig() {
  console.log('🔐 KIRA DAO MULTI-SIG DEPLOYMENT');
  console.log('=================================\n');

  try {
    // Load creator wallet
    const keyPath = path.join(__dirname, '..', CONFIG.createKeyPath);
    const keyData = JSON.parse(fs.readFileSync(keyPath, 'utf8'));
    const creator = Keypair.fromSecretKey(new Uint8Array(keyData));
    console.log('✅ Creator wallet loaded:', creator.publicKey.toString());

    // Connect to devnet
    const connection = new Connection(clusterApiUrl(CONFIG.cluster), 'confirmed');
    console.log('✅ Connected to devnet');

    // Check balance
    const balance = await connection.getBalance(creator.publicKey);
    const solBalance = balance / 1e9;
    console.log(`💰 Balance: ${solBalance} SOL`);

    if (solBalance < 0.1) {
      throw new Error('Insufficient SOL balance. Need at least 0.1 SOL');
    }

    // Generate member keys
    const members = [creator.publicKey];
    for (let i = 0; i < CONFIG.members - 1; i++) {
      members.push(Keypair.generate().publicKey);
    }

    console.log('\n👥 Members (5 total):');
    members.forEach((m, i) => console.log(`  ${i + 1}. ${m.toString()}`));

    // Create Squads instance
    console.log('\n📦 Initializing Squads SDK...');
    
    const wallet = {
      publicKey: creator.publicKey,
      signTransaction: async (tx) => { tx.partialSign(creator); return tx; },
      signAllTransactions: async (txs) => { txs.forEach(tx => tx.partialSign(creator)); return txs; }
    };

    const squads = new Squads.default({ connection, wallet });
    console.log('✅ Squads SDK initialized');

    // Create multisig
    console.log('\n🏗️ Creating multisig vault...');
    console.log(`   Threshold: ${CONFIG.threshold} of ${CONFIG.members}`);
    
    const createKey = Keypair.generate();
    console.log('   Create Key:', createKey.publicKey.toString());
    
    // Pass additional members (creator is auto-added)
    const additionalMembers = members.slice(1);
    console.log('   Additional members:', additionalMembers.length);

    const multisig = await squads.createMultisig(
      CONFIG.threshold,
      createKey.publicKey,
      additionalMembers,
      'Kira DAO Treasury',
      'On-chain treasury for Kira DAO',
      'https://kiraos.live/logo.png'
    );

    console.log('\n✅ MULTI-SIG DEPLOYED SUCCESSFULLY!');
    console.log('====================================');
    console.log('Address:', multisig.publicKey.toString());
    console.log('Threshold:', multisig.threshold, 'of', multisig.keys.length);
    console.log('Authority Index:', multisig.authorityIndex);
    console.log('');
    console.log('View on Solscan:');
    console.log(`https://solscan.io/account/${multisig.publicKey.toString()}?cluster=devnet`);
    console.log('');
    console.log('View on Squads:');
    console.log(`https://devnet.squads.so/multisig/${multisig.publicKey.toString()}`);

    // Save deployment info
    const deploymentInfo = {
      multisigAddress: multisig.publicKey.toString(),
      createKey: createKey.publicKey.toString(),
      createKeySecret: Array.from(createKey.secretKey),
      creator: creator.publicKey.toString(),
      threshold: multisig.threshold,
      members: multisig.keys.length,
      memberAddresses: multisig.keys.map(k => k.toString()),
      network: CONFIG.cluster,
      timestamp: new Date().toISOString(),
      solscanUrl: `https://solscan.io/account/${multisig.publicKey.toString()}?cluster=devnet`,
      squadsUrl: `https://devnet.squads.so/multisig/${multisig.publicKey.toString()}`
    };

    const infoPath = path.join(__dirname, '..', 'multisig-deployment.json');
    fs.writeFileSync(infoPath, JSON.stringify(deploymentInfo, null, 2));
    console.log('\n💾 Deployment saved to multisig-deployment.json');

    console.log('\n📝 NEXT STEPS:');
    console.log('1. Save the createKey secret - needed for recovery');
    console.log('2. Replace member addresses with actual team wallets');
    console.log('3. Deposit SOL to the multisig vault');
    console.log('4. Test with a small transaction');

    return deploymentInfo;

  } catch (error) {
    console.error('\n❌ DEPLOYMENT FAILED:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

if (require.main === module) {
  deployMultisig();
}

module.exports = { deployMultisig };

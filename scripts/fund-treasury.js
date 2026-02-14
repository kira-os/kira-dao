#!/usr/bin/env node

/**
 * Fund the multi-sig treasury
 * Transfer SOL from deployer to multisig vault
 */

const { Connection, Keypair, PublicKey, SystemProgram, Transaction, LAMPORTS_PER_SOL } = require('@solana/web3.js');
const fs = require('fs');
const path = require('path');

async function fundTreasury() {
  console.log('💰 FUNDING MULTI-SIG TREASURY');
  console.log('==============================\n');

  try {
    // Load deployment info
    const deploymentPath = path.join(__dirname, '..', 'multisig-deployment.json');
    const deployment = JSON.parse(fs.readFileSync(deploymentPath, 'utf8'));
    
    // Load deployer wallet
    const keyPath = path.join(__dirname, '..', 'wallets/deployer.json');
    const keyData = JSON.parse(fs.readFileSync(keyPath, 'utf8'));
    const deployer = Keypair.fromSecretKey(new Uint8Array(keyData));
    
    const connection = new Connection('https://api.devnet.solana.com', 'confirmed');
    const multisigAddress = new PublicKey(deployment.multisigAddress);
    
    console.log('From:', deployer.publicKey.toString());
    console.log('To (Treasury):', multisigAddress.toString());
    
    // Check balances
    const deployerBalance = await connection.getBalance(deployer.publicKey);
    const treasuryBalance = await connection.getBalance(multisigAddress);
    
    console.log(`\nDeployer Balance: ${deployerBalance / LAMPORTS_PER_SOL} SOL`);
    console.log(`Treasury Balance: ${treasuryBalance / LAMPORTS_PER_SOL} SOL`);
    
    // Transfer 1.5 SOL to treasury
    const amount = 1.5 * LAMPORTS_PER_SOL;
    
    if (deployerBalance < amount + 5000) {
      throw new Error('Insufficient balance for transfer + fees');
    }
    
    console.log(`\n🔄 Transferring 1.5 SOL to treasury...`);
    
    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: deployer.publicKey,
        toPubkey: multisigAddress,
        lamports: amount
      })
    );
    
    const signature = await connection.sendTransaction(transaction, [deployer]);
    await connection.confirmTransaction(signature);
    
    console.log('✅ Transfer complete!');
    console.log('Transaction:', signature);
    
    // Verify new balance
    const newTreasuryBalance = await connection.getBalance(multisigAddress);
    console.log(`\nNew Treasury Balance: ${newTreasuryBalance / LAMPORTS_PER_SOL} SOL`);
    
    // Update deployment info
    deployment.treasuryBalance = newTreasuryBalance / LAMPORTS_PER_SOL;
    deployment.lastFunded = new Date().toISOString();
    fs.writeFileSync(deploymentPath, JSON.stringify(deployment, null, 2));
    
    console.log('\n✅ Treasury funded and ready for operations!');
    
  } catch (error) {
    console.error('\n❌ Funding failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  fundTreasury();
}

module.exports = { fundTreasury };

#!/usr/bin/env node

/**
 * Deploy Test Token on Solana Devnet
 * Creates a test KIRA token for DAO testing
 */

const { Connection, Keypair, PublicKey, clusterApiUrl, LAMPORTS_PER_SOL } = require('@solana/web3.js');
const { createMint, getOrCreateAssociatedTokenAccount, mintTo } = require('@solana/spl-token');
const fs = require('fs');
const path = require('path');

async function deployTestToken() {
  console.log('🪙 DEPLOYING TEST KIRA TOKEN');
  console.log('=============================\n');

  try {
    // Load deployer wallet
    const keyPath = path.join(__dirname, '..', 'wallets/deployer.json');
    const keyData = JSON.parse(fs.readFileSync(keyPath, 'utf8'));
    const payer = Keypair.fromSecretKey(new Uint8Array(keyData));
    
    const connection = new Connection(clusterApiUrl('devnet'), 'confirmed');
    
    console.log('Payer:', payer.publicKey.toString());
    
    // Check balance
    const balance = await connection.getBalance(payer.publicKey);
    console.log(`Balance: ${balance / LAMPORTS_PER_SOL} SOL`);
    
    if (balance < 0.05) {
      throw new Error('Insufficient SOL for token deployment');
    }
    
    // Create mint
    console.log('\n🏗️ Creating token mint...');
    const mint = await createMint(
      connection,
      payer,
      payer.publicKey,  // mint authority
      payer.publicKey,  // freeze authority
      9  // 9 decimals like SOL
    );
    
    console.log('✅ Token mint created:', mint.toString());
    
    // Create token account for payer
    console.log('\n💳 Creating token account...');
    const tokenAccount = await getOrCreateAssociatedTokenAccount(
      connection,
      payer,
      mint,
      payer.publicKey
    );
    
    console.log('Token account:', tokenAccount.address.toString());
    
    // Mint 1,000,000 tokens to payer
    const mintAmount = 1000000 * 1e9; // 1M with 9 decimals
    console.log(`\n💰 Minting 1,000,000 tokens...`);
    
    await mintTo(
      connection,
      payer,
      mint,
      tokenAccount.address,
      payer,
      mintAmount
    );
    
    console.log('✅ Tokens minted!');
    
    // Load multisig info
    const deploymentPath = path.join(__dirname, '..', 'multisig-deployment.json');
    const deployment = JSON.parse(fs.readFileSync(deploymentPath, 'utf8'));
    const multisigAddress = new PublicKey(deployment.multisigAddress);
    
    // Create token account for multisig treasury
    console.log('\n🏦 Creating treasury token account...');
    const treasuryTokenAccount = await getOrCreateAssociatedTokenAccount(
      connection,
      payer,
      mint,
      multisigAddress,
      true  // allowOwnerOffCurve for PDA
    );
    
    console.log('Treasury token account:', treasuryTokenAccount.address.toString());
    
    // Mint tokens to treasury
    const treasuryAmount = 500000 * 1e9; // 500K to treasury
    console.log(`\n💰 Minting 500,000 tokens to treasury...`);
    
    await mintTo(
      connection,
      payer,
      mint,
      treasuryTokenAccount.address,
      payer,
      treasuryAmount
    );
    
    console.log('✅ Treasury funded!');
    
    // Save token info
    const tokenInfo = {
      name: 'KIRA Test Token',
      symbol: 'tKIRA',
      mint: mint.toString(),
      decimals: 9,
      totalSupply: 1000000,
      deployer: payer.publicKey.toString(),
      deployerAccount: tokenAccount.address.toString(),
      treasuryAccount: treasuryTokenAccount.address.toString(),
      multisigTreasury: multisigAddress.toString(),
      network: 'devnet',
      timestamp: new Date().toISOString(),
      solscanUrl: `https://solscan.io/token/${mint.toString()}?cluster=devnet`
    };
    
    const infoPath = path.join(__dirname, '..', 'test-token.json');
    fs.writeFileSync(infoPath, JSON.stringify(tokenInfo, null, 2));
    
    console.log('\n✅ TEST TOKEN DEPLOYED!');
    console.log('=======================');
    console.log('Name:', tokenInfo.name);
    console.log('Symbol:', tokenInfo.symbol);
    console.log('Mint:', mint.toString());
    console.log('Total Supply:', tokenInfo.totalSupply.toLocaleString());
    console.log('Deployer Holdings:', '500,000 tKIRA');
    console.log('Treasury Holdings:', '500,000 tKIRA');
    console.log('');
    console.log('View on Solscan:');
    console.log(tokenInfo.solscanUrl);
    console.log('');
    console.log('💾 Token info saved to test-token.json');
    
    return tokenInfo;
    
  } catch (error) {
    console.error('\n❌ Token deployment failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

if (require.main === module) {
  deployTestToken();
}

module.exports = { deployTestToken };

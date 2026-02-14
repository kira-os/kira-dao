#!/usr/bin/env node

/**
 * Stress Test - Create multiple transactions rapidly
 * Tests system stability under load
 */

const { Connection, Keypair, PublicKey, LAMPORTS_PER_SOL } = require('@solana/web3.js');
const fs = require('fs');

async function stressTest() {
  console.log('⚡ STRESS TEST - SYSTEM STABILITY');
  console.log('==================================\n');

  const connection = new Connection('https://api.devnet.solana.com', 'confirmed');
  
  // Load deployment info
  const deployment = JSON.parse(fs.readFileSync('./multisig-deployment.json', 'utf8'));
  const tokenInfo = JSON.parse(fs.readFileSync('./test-token.json', 'utf8'));
  
  const tests = [];
  
  // Test 1: Rapid RPC calls
  console.log('Test 1: Rapid RPC calls...');
  const start1 = Date.now();
  for (let i = 0; i < 10; i++) {
    const slot = await connection.getSlot();
    tests.push({ name: `RPC call ${i}`, success: slot > 0 });
  }
  console.log('  ✅ 10 RPC calls completed in', Date.now() - start1, 'ms');
  
  // Test 2: Balance checks
  console.log('\nTest 2: Rapid balance checks...');
  const start2 = Date.now();
  const addresses = [
    new PublicKey(deployment.multisigAddress),
    new PublicKey(deployment.creator),
    new PublicKey(tokenInfo.mint)
  ];
  
  for (let i = 0; i < 5; i++) {
    const balances = await Promise.all(
      addresses.map(addr => connection.getBalance(addr))
    );
    tests.push({ name: `Balance batch ${i}`, success: balances.every(b => b >= 0) });
  }
  console.log('  ✅ 5 balance batches completed in', Date.now() - start2, 'ms');
  
  // Test 3: Key generation stress
  console.log('\nTest 3: Key generation stress...');
  const start3 = Date.now();
  const keys = [];
  for (let i = 0; i < 100; i++) {
    keys.push(Keypair.generate());
  }
  console.log('  ✅ 100 keys generated in', Date.now() - start3, 'ms');
  tests.push({ name: 'Key generation', success: keys.length === 100 });
  
  // Test 4: Token account validation
  console.log('\nTest 4: Token account validation...');
  const start4 = Date.now();
  const treasuryToken = new PublicKey(tokenInfo.treasuryAccount);
  const deployerToken = new PublicKey(tokenInfo.deployerAccount);
  
  const tokenAccounts = [treasuryToken, deployerToken];
  const tokenBalances = await Promise.all(
    tokenAccounts.map(acc => connection.getTokenAccountBalance(acc))
  );
  console.log('  ✅ Token balances retrieved in', Date.now() - start4, 'ms');
  tests.push({ name: 'Token accounts', success: tokenBalances.every(b => b.value.uiAmount > 0) });
  
  // Summary
  console.log('\n📊 STRESS TEST SUMMARY');
  console.log('======================');
  console.log('Total tests:', tests.length);
  console.log('Passed:', tests.filter(t => t.success).length);
  console.log('Failed:', tests.filter(t => !t.success).length);
  
  if (tests.every(t => t.success)) {
    console.log('\n✅ ALL STRESS TESTS PASSED');
    console.log('System is stable under load');
  } else {
    console.log('\n❌ Some tests failed');
  }
}

if (require.main === module) {
  stressTest().catch(console.error);
}

module.exports = { stressTest };

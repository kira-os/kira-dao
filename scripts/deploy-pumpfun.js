#!/usr/bin/env node

/**
 * Kira DAO Token Deployment Script for Pump.fun
 * 
 * This script handles the deployment of the Kira DAO token on Pump.fun
 * Includes wallet management, deployment, and initial liquidity setup
 */

const { Connection, Keypair, PublicKey, Transaction, SystemProgram } = require('@solana/web3.js');
const { Token, TOKEN_PROGRAM_ID } = require('@solana/spl-token');
const bs58 = require('bs58');
const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
  // Network - can be overridden by environment variable
  NETWORK: process.env.SOLANA_NETWORK || 'devnet', // 'devnet', 'testnet', or 'mainnet-beta'
  RPC_ENDPOINTS: {
    'devnet': 'https://api.devnet.solana.com',
    'testnet': 'https://api.testnet.solana.com',
    'mainnet-beta': 'https://api.mainnet-beta.solana.com'
  },
  // Token details
  TOKEN_NAME: 'Kira DAO',
  TOKEN_SYMBOL: 'KIRA',
  TOKEN_DECIMALS: 9,
  TOTAL_SUPPLY: 1_000_000_000, // 1 billion tokens
  // Pump.fun deployment
  PUMP_FUN_PROGRAM_ID: '6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P',
  BONDING_CURVE_START_PRICE: 0.000001, // Starting price in SOL
  // Distribution
  INITIAL_LIQUIDITY_PERCENTAGE: 40, // 40% for initial bonding curve
  TREASURY_PERCENTAGE: 30,
  TEAM_PERCENTAGE: 15,
  COMMUNITY_PERCENTAGE: 15,
};

class KiraDAOTokenDeployer {
  constructor() {
    const rpcEndpoint = CONFIG.RPC_ENDPOINTS[CONFIG.NETWORK] || CONFIG.RPC_ENDPOINTS['devnet'];
    this.connection = new Connection(rpcEndpoint, 'confirmed');
    this.keypair = null;
    this.tokenMint = null;
    this.tokenAccount = null;
    this.network = CONFIG.NETWORK;
  }

  /**
   * Load or generate wallet keypair
   */
  async loadWallet() {
    const keypairPath = path.join(__dirname, '../wallets/deployer.json');
    
    try {
      if (fs.existsSync(keypairPath)) {
        console.log('Loading existing wallet...');
        const keypairData = JSON.parse(fs.readFileSync(keypairPath, 'utf8'));
        this.keypair = Keypair.fromSecretKey(new Uint8Array(keypairData));
      } else {
        console.log('Generating new wallet...');
        this.keypair = Keypair.generate();
        
        // Save the wallet
        fs.mkdirSync(path.dirname(keypairPath), { recursive: true });
        fs.writeFileSync(keypairPath, JSON.stringify(Array.from(this.keypair.secretKey)));
        console.log(`Wallet saved to: ${keypairPath}`);
      }
      
      console.log(`Wallet address: ${this.keypair.publicKey.toString()}`);
      return this.keypair;
    } catch (error) {
      console.error('Error loading wallet:', error);
      throw error;
    }
  }

  /**
   * Check wallet balance
   */
  async checkBalance() {
    const balance = await this.connection.getBalance(this.keypair.publicKey);
    const balanceSOL = balance / 1e9;
    
    console.log(`Wallet balance: ${balanceSOL} SOL`);
    
    if (balanceSOL < 0.1) {
      console.warn('Warning: Wallet balance is low. Need at least 0.1 SOL for deployment.');
      
      if (this.network === 'devnet') {
        console.log('\n=== DEVNET FUNDING INSTRUCTIONS ===');
        console.log('To get devnet SOL for testing:');
        console.log(`1. Visit: https://solfaucet.com`);
        console.log(`2. Enter wallet address: ${this.keypair.publicKey.toString()}`);
        console.log(`3. Select "Devnet" network`);
        console.log(`4. Request SOL (request multiple times if needed)`);
        console.log(`5. Run deployment script again`);
      } else {
        console.log('Please fund the wallet before proceeding.');
      }
    }
    
    return balanceSOL;
  }

  /**
   * Create SPL token
   */
  async createToken() {
    console.log('Creating SPL token...');
    
    try {
      // Create mint
      this.tokenMint = await Token.createMint(
        this.connection,
        this.keypair,
        this.keypair.publicKey,
        null,
        CONFIG.TOKEN_DECIMALS,
        TOKEN_PROGRAM_ID
      );
      
      console.log(`Token mint created: ${this.tokenMint.publicKey.toString()}`);
      
      // Create associated token account
      this.tokenAccount = await this.tokenMint.createAssociatedTokenAccount(
        this.keypair.publicKey
      );
      
      console.log(`Token account created: ${this.tokenAccount.toString()}`);
      
      // Mint initial supply
      const initialSupply = CONFIG.TOTAL_SUPPLY * Math.pow(10, CONFIG.TOKEN_DECIMALS);
      await this.tokenMint.mintTo(
        this.tokenAccount,
        this.keypair.publicKey,
        [],
        initialSupply
      );
      
      console.log(`Minted ${CONFIG.TOTAL_SUPPLY.toLocaleString()} tokens to wallet`);
      
      return {
        mint: this.tokenMint.publicKey.toString(),
        account: this.tokenAccount.toString(),
        supply: initialSupply
      };
    } catch (error) {
      console.error('Error creating token:', error);
      throw error;
    }
  }

  /**
   * Prepare token metadata for Pump.fun
   */
  async prepareMetadata() {
    const metadata = {
      name: CONFIG.TOKEN_NAME,
      symbol: CONFIG.TOKEN_SYMBOL,
      description: 'AI-native DAO token. Token holders steer the intelligence — live development, revenue distribution, on-chain governance.',
      image: 'https://raw.githubusercontent.com/kira-os/kira-dao/main/assets/logo.png',
      external_url: 'https://kiraos.live',
      attributes: [
        {
          trait_type: 'Type',
          value: 'DAO Token'
        },
        {
          trait_type: 'Network',
          value: 'Solana'
        },
        {
          trait_type: 'Governance',
          value: 'On-chain'
        },
        {
          trait_type: 'Revenue Model',
          value: 'Staking Rewards'
        }
      ],
      properties: {
        category: 'token',
        creators: [
          {
            address: this.keypair.publicKey.toString(),
            share: 100
          }
        ]
      }
    };
    
    // Save metadata to file
    const metadataPath = path.join(__dirname, '../metadata/token-metadata.json');
    fs.mkdirSync(path.dirname(metadataPath), { recursive: true });
    fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));
    
    console.log(`Token metadata saved to: ${metadataPath}`);
    return metadata;
  }

  /**
   * Deploy to Pump.fun bonding curve
   * Note: This is a simplified version. Actual Pump.fun integration would use their SDK
   */
  async deployToPumpFun() {
    console.log('Preparing Pump.fun deployment...');
    
    // Calculate amounts for bonding curve
    const totalTokens = CONFIG.TOTAL_SUPPLY * Math.pow(10, CONFIG.TOKEN_DECIMALS);
    const bondingCurveTokens = (totalTokens * CONFIG.INITIAL_LIQUIDITY_PERCENTAGE) / 100;
    
    console.log(`Total tokens: ${CONFIG.TOTAL_SUPPLY.toLocaleString()}`);
    console.log(`Bonding curve tokens: ${(bondingCurveTokens / Math.pow(10, CONFIG.TOKEN_DECIMALS)).toLocaleString()} (${CONFIG.INITIAL_LIQUIDITY_PERCENTAGE}%)`);
    console.log(`Starting price: ${CONFIG.BONDING_CURVE_START_PRICE} SOL`);
    
    // Note: Actual Pump.fun deployment would involve:
    // 1. Creating bonding curve account
    // 2. Depositing initial liquidity
    // 3. Setting up the bonding curve parameters
    // 4. Initializing the market
    
    console.log('\n=== DEPLOYMENT READY ===');
    console.log('To deploy on Pump.fun:');
    console.log(`1. Go to: https://pump.fun`);
    console.log(`2. Connect wallet: ${this.keypair.publicKey.toString()}`);
    console.log(`3. Enter token details:`);
    console.log(`   - Name: ${CONFIG.TOKEN_NAME}`);
    console.log(`   - Symbol: ${CONFIG.TOKEN_SYMBOL}`);
    console.log(`   - Decimals: ${CONFIG.TOKEN_DECIMALS}`);
    console.log(`   - Total Supply: ${CONFIG.TOTAL_SUPPLY.toLocaleString()}`);
    console.log(`4. Set initial price: ${CONFIG.BONDING_CURVE_START_PRICE} SOL`);
    console.log(`5. Deploy!`);
    
    return {
      wallet: this.keypair.publicKey.toString(),
      tokenMint: this.tokenMint?.publicKey?.toString() || 'Not created yet',
      bondingCurveTokens: bondingCurveTokens,
      startPrice: CONFIG.BONDING_CURVE_START_PRICE
    };
  }

  /**
   * Create distribution plan
   */
  createDistributionPlan() {
    const distribution = {
      bondingCurve: {
        percentage: CONFIG.INITIAL_LIQUIDITY_PERCENTAGE,
        tokens: (CONFIG.TOTAL_SUPPLY * CONFIG.INITIAL_LIQUIDITY_PERCENTAGE) / 100,
        description: 'Initial liquidity on Pump.fun bonding curve'
      },
      treasury: {
        percentage: CONFIG.TREASURY_PERCENTAGE,
        tokens: (CONFIG.TOTAL_SUPPLY * CONFIG.TREASURY_PERCENTAGE) / 100,
        description: 'Development, marketing, and reserves'
      },
      team: {
        percentage: CONFIG.TEAM_PERCENTAGE,
        tokens: (CONFIG.TOTAL_SUPPLY * CONFIG.TEAM_PERCENTAGE) / 100,
        description: 'Team and advisors (2-year vesting)'
      },
      community: {
        percentage: CONFIG.COMMUNITY_PERCENTAGE,
        tokens: (CONFIG.TOTAL_SUPPLY * CONFIG.COMMUNITY_PERCENTAGE) / 100,
        description: 'Airdrops, incentives, and rewards'
      }
    };
    
    console.log('\n=== TOKEN DISTRIBUTION ===');
    Object.entries(distribution).forEach(([key, value]) => {
      console.log(`${key}: ${value.tokens.toLocaleString()} tokens (${value.percentage}%) - ${value.description}`);
    });
    
    return distribution;
  }

  /**
   * Generate deployment report
   */
  generateReport(deploymentInfo) {
    const report = {
      timestamp: new Date().toISOString(),
      deployment: deploymentInfo,
      distribution: this.createDistributionPlan(),
      metadata: this.prepareMetadata(),
      instructions: {
        nextSteps: [
          'Fund wallet with SOL for deployment',
          'Deploy token on Pump.fun using the details above',
          'Set up initial liquidity bonding curve',
          'Create governance proposal system',
          'Implement staking mechanism',
          'Launch marketing campaign'
        ],
        importantNotes: [
          'Keep private key secure!',
          'Test on devnet first',
          'Consider multi-sig for treasury',
          'Plan token unlock schedule',
          'Prepare community announcement'
        ]
      }
    };
    
    const reportPath = path.join(__dirname, '../reports/deployment-report.json');
    fs.mkdirSync(path.dirname(reportPath), { recursive: true });
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    console.log(`\nDeployment report saved to: ${reportPath}`);
    return report;
  }

  /**
   * Main deployment flow
   */
  async deploy() {
    console.log('=== KIRA DAO TOKEN DEPLOYMENT ===\n');
    
    try {
      // Step 1: Load wallet
      await this.loadWallet();
      
      // Step 2: Check balance
      const balance = await this.checkBalance();
      if (balance < 0.1) {
        console.log('\nPlease fund the wallet and run again.');
        return;
      }
      
      // Step 3: Create token (optional - can be done through Pump.fun UI)
      // await this.createToken();
      
      // Step 4: Prepare metadata
      await this.prepareMetadata();
      
      // Step 5: Create distribution plan
      this.createDistributionPlan();
      
      // Step 6: Prepare Pump.fun deployment
      const deploymentInfo = await this.deployToPumpFun();
      
      // Step 7: Generate report
      this.generateReport(deploymentInfo);
      
      console.log('\n=== DEPLOYMENT PREPARATION COMPLETE ===');
      console.log('Ready to deploy on Pump.fun!');
      
    } catch (error) {
      console.error('Deployment failed:', error);
      process.exit(1);
    }
  }
}

// Run deployment if called directly
if (require.main === module) {
  const deployer = new KiraDAOTokenDeployer();
  deployer.deploy();
}

module.exports = KiraDAOTokenDeployer;
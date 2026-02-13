// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";

contract KiraDAO is ERC20, Ownable, ERC20Burnable {
    // Staking structure
    struct Stake {
        uint256 amount;
        uint256 lockUntil;
        uint256 rewardMultiplier;
    }
    
    // Governance proposal
    struct Proposal {
        uint256 id;
        address proposer;
        string description;
        uint256 forVotes;
        uint256 againstVotes;
        uint256 abstainVotes;
        uint256 startTime;
        uint256 endTime;
        bool executed;
    }
    
    // Revenue distribution
    struct RevenueShare {
        uint256 stakingRewards; // 70%
        uint256 treasury;       // 20%
        uint256 burn;           // 10%
    }
    
    // Constants
    uint256 public constant TOTAL_SUPPLY = 1_000_000_000 * 10**18;
    RevenueShare public revenueShare = RevenueShare(7000, 2000, 1000); // Basis points (70%, 20%, 10%)
    
    // State variables
    mapping(address => Stake) public stakes;
    mapping(uint256 => Proposal) public proposals;
    mapping(address => mapping(uint256 => bool)) public hasVoted;
    
    uint256 public proposalCount;
    uint256 public totalStaked;
    uint256 public totalRevenue;
    
    // Events
    event Staked(address indexed user, uint256 amount, uint256 lockUntil);
    event Unstaked(address indexed user, uint256 amount);
    event RevenueDistributed(uint256 stakingRewards, uint256 treasury, uint256 burned);
    event ProposalCreated(uint256 indexed proposalId, address proposer, string description);
    event Voted(uint256 indexed proposalId, address voter, uint8 support);
    event ProposalExecuted(uint256 indexed proposalId);
    
    constructor() ERC20("Kira DAO", "KIRA") Ownable(msg.sender) {
        _mint(msg.sender, TOTAL_SUPPLY);
    }
    
    // Staking functions
    function stake(uint256 amount, uint256 lockDays) external {
        require(amount > 0, "Amount must be greater than 0");
        require(lockDays >= 1 && lockDays <= 365, "Lock period 1-365 days");
        
        _transfer(msg.sender, address(this), amount);
        
        uint256 lockUntil = block.timestamp + (lockDays * 1 days);
        uint256 multiplier = calculateMultiplier(lockDays);
        
        stakes[msg.sender] = Stake({
            amount: stakes[msg.sender].amount + amount,
            lockUntil: lockUntil,
            rewardMultiplier: multiplier
        });
        
        totalStaked += amount;
        
        emit Staked(msg.sender, amount, lockUntil);
    }
    
    function unstake() external {
        Stake memory userStake = stakes[msg.sender];
        require(userStake.amount > 0, "No stake found");
        require(block.timestamp >= userStake.lockUntil, "Lock period not ended");
        
        uint256 amount = userStake.amount;
        uint256 rewards = calculateRewards(msg.sender);
        
        _transfer(address(this), msg.sender, amount + rewards);
        
        delete stakes[msg.sender];
        totalStaked -= amount;
        
        emit Unstaked(msg.sender, amount + rewards);
    }
    
    // Governance functions
    function createProposal(string memory description) external returns (uint256) {
        require(balanceOf(msg.sender) >= totalSupply() / 100, "Need 1% of supply to propose");
        
        proposalCount++;
        uint256 proposalId = proposalCount;
        
        proposals[proposalId] = Proposal({
            id: proposalId,
            proposer: msg.sender,
            description: description,
            forVotes: 0,
            againstVotes: 0,
            abstainVotes: 0,
            startTime: block.timestamp,
            endTime: block.timestamp + 7 days,
            executed: false
        });
        
        emit ProposalCreated(proposalId, msg.sender, description);
        return proposalId;
    }
    
    function vote(uint256 proposalId, uint8 support) external {
        Proposal storage proposal = proposals[proposalId];
        require(proposal.id != 0, "Proposal doesn't exist");
        require(block.timestamp >= proposal.startTime && block.timestamp <= proposal.endTime, "Voting period");
        require(!hasVoted[msg.sender][proposalId], "Already voted");
        
        uint256 votingPower = balanceOf(msg.sender);
        
        if (support == 1) {
            proposal.forVotes += votingPower;
        } else if (support == 2) {
            proposal.againstVotes += votingPower;
        } else if (support == 3) {
            proposal.abstainVotes += votingPower;
        }
        
        hasVoted[msg.sender][proposalId] = true;
        emit Voted(proposalId, msg.sender, support);
    }
    
    function executeProposal(uint256 proposalId) external {
        Proposal storage proposal = proposals[proposalId];
        require(proposal.id != 0, "Proposal doesn't exist");
        require(block.timestamp > proposal.endTime, "Voting not ended");
        require(!proposal.executed, "Already executed");
        
        uint256 totalVotes = proposal.forVotes + proposal.againstVotes + proposal.abstainVotes;
        uint256 quorum = totalSupply() / 10; // 10% quorum
        
        require(totalVotes >= quorum, "Quorum not reached");
        require(proposal.forVotes > proposal.againstVotes, "Proposal not approved");
        
        proposal.executed = true;
        emit ProposalExecuted(proposalId);
        
        // Proposal execution logic would go here
        // This would be implemented based on the proposal type
    }
    
    // Revenue distribution
    function distributeRevenue(uint256 amount) external onlyOwner {
        require(amount > 0, "Amount must be greater than 0");
        
        uint256 stakingRewards = (amount * revenueShare.stakingRewards) / 10000;
        uint256 treasuryAmount = (amount * revenueShare.treasury) / 10000;
        uint256 burnAmount = (amount * revenueShare.burn) / 10000;
        
        // Distribute to stakers (simplified - actual distribution would be more complex)
        // For now, just track total revenue
        totalRevenue += amount;
        
        // Burn tokens
        if (burnAmount > 0) {
            _burn(address(this), burnAmount);
        }
        
        emit RevenueDistributed(stakingRewards, treasuryAmount, burnAmount);
    }
    
    // Helper functions
    function calculateMultiplier(uint256 lockDays) internal pure returns (uint256) {
        // Base multiplier: 100 = 1x
        // 30 days = 1.5x, 90 days = 2x, 365 days = 3x
        if (lockDays >= 365) return 300;
        if (lockDays >= 180) return 250;
        if (lockDays >= 90) return 200;
        if (lockDays >= 30) return 150;
        return 100;
    }
    
    function calculateRewards(address user) public view returns (uint256) {
        Stake memory userStake = stakes[user];
        if (userStake.amount == 0) return 0;
        
        // Simplified reward calculation
        // Actual implementation would track reward accumulation over time
        uint256 timeStaked = block.timestamp - (userStake.lockUntil - (userStake.rewardMultiplier / 100 * 1 days));
        uint256 baseReward = (userStake.amount * timeStaked) / (365 days);
        
        return (baseReward * userStake.rewardMultiplier) / 100;
    }
    
    // View functions
    function getProposal(uint256 proposalId) external view returns (Proposal memory) {
        return proposals[proposalId];
    }
    
    function getUserStake(address user) external view returns (Stake memory) {
        return stakes[user];
    }
    
    function getStakingAPR() external pure returns (uint256) {
        // Simplified APR calculation
        // Actual would be based on revenue and total staked
        return 1500; // 15% APR in basis points
    }
}
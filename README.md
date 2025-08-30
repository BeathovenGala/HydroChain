# HydroChain

**Empowering a Sustainable Future with Blockchain-Powered Green Hydrogen Credits**

---

## Overview

HydroChain is a comprehensive blockchain platform designed to be **Transparent · Verifiable · Decentralized**. Our system enables the seamless issuance, verification, and tracking of green hydrogen credits across their entire lifecycle, ensuring trust and accountability in the green hydrogen ecosystem.

## Use Case

HydroChain addresses critical market challenges in green hydrogen credit trading by:
- **Enabling secure buying and selling** of green hydrogen credits
- **Preventing greenwashing** through transparent verification
- **Eliminating duplicate selling** with blockchain-based immutability
- **Facilitating safe retirement** of credits with complete audit trails

Blockchain technology serves as the foundation for trust, ensuring every transaction is transparent, verifiable, and tamper-proof.

## Features Implemented

### Backend Infrastructure
- **Issue Request Management**: Streamlined credit issuance workflow
- **Buy Request Processing**: Secure purchase transaction handling  
- **Authentication System**: Role-based access control for all user types
- **Request Tracking**: PostgreSQL database for comprehensive audit trails

### Smart Contracts
- **Solidity-based Smart Contracts**: Automated credit lifecycle management
- **Non-Duplicatable Credits**: Unique token generation preventing fraud
- **Buying & Selling Logic**: Secure transfer mechanisms
- **Governing Authority Integration**: Automated approval/rejection workflows

### Governance
- **Authority Verification**: Governing bodies can accept or reject permissions
- **Compliance Monitoring**: Real-time oversight of all transactions
- **Regulatory Integration**: Support for external auditors and verifiers

## Frontend Experience

Built with modern web technologies for optimal user experience:
- **Landing Page**: Professional introduction to the platform
- **Plant Dashboard**: Specialized interface for hydrogen producers
- **High-Performance Stack**: React.js with Vite, ShadCN UI components

## Future Roadmap

### Phase 1 - Enhanced Security
- **Credit Retirement System**: Complete lifecycle management
- **DID Verification**: Decentralized Identity integration
- **Verifiable Credentials (VCs)**: Cryptographic proof of authenticity

### Phase 2 - IoT Integration
- **Real-time IoT Monitoring**: Sensor data integration for verification
- **Automated Validation**: IoT-triggered credit issuance
- **Enhanced Compliance**: Real-world data validation for selling and retirement

## Technology Stack

### Frontend
- **React.js** with **Vite** for fast development and builds
- **React Router DOM** for seamless navigation
- **Tailwind CSS** for responsive, modern styling
- **ShadCN UI** for consistent, accessible components

### Backend
- **Elysia Framework** for robust server-side logic
- **PostgreSQL** for reliable data persistence and request tracking
- **RESTful APIs** for seamless frontend-backend communication

### Blockchain
- **Solidity Smart Contracts** for automated, trustless operations
- **Ethereum-compatible networks** for broad ecosystem support
- **Sepolia Testnet** for development and testing

## Smart Contract Implementation

### HydrogenCredit Contract

Our core smart contract handles the complete lifecycle of green hydrogen credits:

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract HydrogenCredit {
    struct Credit {
        string id;
        address issuer;
        address holder;
        uint256 amount;
        uint256 timestamp;
        bool retired;
    }

    Credit[] public credits;
    mapping(string => uint256) public creditIdToIndex; // Map string ID to array index
    mapping(string => bool) public creditExists; // Check if ID already exists

    event CreditIssued(
        string indexed id,
        address indexed issuer,
        uint256 amount
    );
    event CreditTransferred(
        string indexed id,
        address indexed from,
        address indexed to
    );
    event CreditRetired(string indexed id, address indexed holder);

    function issueCredit(string memory id, address to, uint256 amount) public {
        require(!creditExists[id], 'Credit ID already exists');
        credits.push(
            Credit({
                id: id,
                issuer: msg.sender,
                holder: to,
                amount: amount,
                timestamp: block.timestamp,
                retired: false
            })
        );
        // Map the string ID to array index
        creditIdToIndex[id] = credits.length - 1;
        creditExists[id] = true;
        emit CreditIssued(id, msg.sender, amount);
    }

    function transferCredit(string memory creditId, address to) public {
        require(creditExists[creditId], "Credit doesn't exist");
        uint256 index = creditIdToIndex[creditId];
        require(credits[index].holder == msg.sender, 'Not your credit');
        require(!credits[index].retired, 'Credit already retired');
        credits[index].holder = to;
        emit CreditTransferred(creditId, msg.sender, to);
    }

    function retireCredit(string memory creditId) public {
        require(creditExists[creditId], "Credit doesn't exist");
        uint256 index = creditIdToIndex[creditId];
        require(credits[index].holder == msg.sender, 'Not your credit');
        require(!credits[index].retired, 'Already retired');
        credits[index].retired = true;
        emit CreditRetired(creditId, msg.sender);
    }

    function getCredit(
        string memory creditId
    ) public view returns (Credit memory) {
        require(creditExists[creditId], "Credit doesn't exist");
        uint256 index = creditIdToIndex[creditId];
        return credits[index];
    }

    function getAllCredits() public view returns (Credit[] memory) {
        return credits;
    }
}
```

### Contract Features
- **Unique Credit IDs**: Prevents duplicate credit creation
- **Full Lifecycle Management**: Issue, transfer, and retire credits
- **Ownership Verification**: Only credit holders can transfer or retire
- **Immutable Records**: All transactions permanently recorded on blockchain
- **Event Logging**: Complete audit trail through blockchain events

## Implementation Guide

### Blockchain Setup

1. **Install MetaMask**
   ```bash
   # Download MetaMask browser extension from metamask.io
   # Create a new wallet and securely store your seed phrase
   ```

2. **Create Local Ethereum Account**
   ```bash
   # In MetaMask:
   # 1. Click on account avatar
   # 2. Select "Create Account" 
   # 3. Name your account (e.g., "HydroChain Dev")
   ```

3. **Configure Sepolia Testnet**
   ```bash
   # Add Sepolia network to MetaMask:
   # Network Name: Sepolia
   # RPC URL: https://sepolia.infura.io/v3/YOUR-PROJECT-ID
   # Chain ID: 11155111
   # Currency Symbol: ETH
   # Block Explorer: https://sepolia.etherscan.io
   ```

4. **Get Test ETH**
   ```bash
   # Visit Sepolia faucet: https://sepoliafaucet.com/
   # Enter your wallet address
   # Receive free Sepolia ETH for testing
   ```

5. **Deploy Smart Contract**
   ```bash
   # Using Hardhat or Remix IDE:
   # 1. Compile the HydrogenCredit.sol contract
   # 2. Connect MetaMask to deployment environment
   # 3. Deploy to Sepolia testnet using test ETH
   # 4. Copy contract address for frontend integration
   ```

6. **Smart Contract Integration**
   ```javascript
   // Frontend integration with Web3
   import Web3 from 'web3';
   
   // Connect to deployed contract
   const web3 = new Web3(window.ethereum);
   const contract = new web3.eth.Contract(ABI, CONTRACT_ADDRESS);
   
   // Issue new credit
   await contract.methods.issueCredit(creditId, recipientAddress, amount)
     .send({ from: userAddress });
   
   // Transfer credit
   await contract.methods.transferCredit(creditId, recipientAddress)
     .send({ from: userAddress });
   
   // Retire credit
   await contract.methods.retireCredit(creditId)
     .send({ from: userAddress });
   ```

## Getting Started

### Prerequisites
- Node.js (v16 or higher)
- PostgreSQL database
- MetaMask browser extension
- Sepolia testnet ETH

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-org/hydrochain.git
   cd hydrochain
   ```

2. **Install frontend dependencies**
   ```bash
   cd frontend
   npm install
   ```

3. **Install backend dependencies**
   ```bash
   cd backend
   npm install
   ```

4. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Configure your database and blockchain settings
   SEPOLIA_RPC_URL=your-sepolia-rpc-url
   CONTRACT_ADDRESS=your-deployed-contract-address
   ```

5. **Deploy smart contracts**
   ```bash
   cd contracts
   npx hardhat compile
   npx hardhat deploy --network sepolia
   ```

6. **Run the application**
   ```bash
   # Start backend
   cd backend && npm start
   
   # Start frontend (new terminal)
   cd frontend && npm run dev
   ```

## Usage

### For Producers
1. Connect MetaMask wallet
2. Request credit issuance through plant dashboard
3. Wait for governing authority approval
4. Receive credits in blockchain wallet

### For Buyers
1. Browse available credits in marketplace
2. Initiate purchase through smart contract
3. Complete transaction using Sepolia ETH
4. Credits automatically transferred to wallet

### For Authorities
1. Review credit issuance requests
2. Verify compliance documentation
3. Approve/reject through governance interface
4. Monitor all transactions on blockchain

## Contributing

We welcome contributions to HydroChain! Please read our contributing guidelines and submit pull requests for any improvements.

---

**Built for HackOut'25 at Dhirubhai Ambani University Gandhinagar**

*Addressing the first problem statement: Blockchain-Based Green Hydrogen Credit System*
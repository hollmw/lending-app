# 🛠️ Project Setup Guide: Lending App

This guide walks you through setting up and running the full-stack lending app on a new machine (e.g., when switching devices or deploying from GitHub).

---

1. System Requirements

Ensure you're using **Ubuntu 24.04+** (tested on Ubuntu 24.04 LTS).

 Install Core Tools:
```bash
sudo apt update && sudo apt install curl git -y
```

Install Geth (Ethereum client):
```bash
sudo add-apt-repository -y ppa:ethereum/ethereum
sudo apt update
sudo apt install geth -y
```

Install Node.js & npm (for frontend + smart contracts):
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs
```

Install Java & Maven (for backend):
```bash
sudo apt install openjdk-17-jdk maven -y
```

---

2. Clone the Project

```bash
git clone https://github.com/your-username/lending-app.git
cd lending-app
```

---

3. Per-Project Setup

 📦 `blockchain/`
```bash
cd blockchain
geth --datadir ./data init genesis.json
```

 📦 `smart-contracts/`
```bash
cd ../smart-contracts
npm install
```

 📦 `backend/`
```bash
cd ../backend
mvn clean install
```

 📦 `frontend/`
```bash
cd ../frontend
npm install
```

---

4. Running the App

 🧱 Start Geth Node (Blockchain)
```bash
cd blockchain
geth --datadir ./data --networkid 2025 --http --http.api eth,web3,net,personal --allow-insecure-unlock
```

 🚀 Deploy Smart Contracts
```bash
cd ../smart-contracts
npx hardhat run scripts/deploy.js --network localhost
```

 🌐 Start Backend API
```bash
cd ../backend
mvn spring-boot:run
```

 💻 Start Frontend App
```bash
cd ../frontend
npm run dev
```

Then visit: `http://localhost:5173`

---

🧠 Notes

- All environment variables and RPC URLs are assumed to be localhost (default dev setup).
- Don't forget to reconfigure Web3j in the backend if the contract address changes.
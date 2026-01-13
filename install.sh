#!/bin/bash

set -e

echo "🚀 Caribbean Hub Deployment"
echo "=============================="
echo ""

#
# Grab common contract(s)
#

cd contracts/src
# Download file
wget https://raw.githubusercontent.com/levuka-schreck/smart-contract-common/master/common/MockUSDC.sol
echo -e "${GREEN}✓${NC} Common contracts are installed"
cd ..

#
# Install dependencies
#

mkdir -p lib

# Install OpenZeppelin Contracts
if [ ! -d "lib/openzeppelin-contracts" ]; then
    echo "Installing OpenZeppelin Contracts..."
    git clone https://github.com/OpenZeppelin/openzeppelin-contracts.git lib/openzeppelin-contracts
    cd lib/openzeppelin-contracts
    git checkout v5.0.0  # Use a stable version
    cd ../..
    echo "✓ OpenZeppelin Contracts installed"
else
    echo "✓ OpenZeppelin Contracts already installed"
fi

# Install Forge Standard Library
if [ ! -d "lib/forge-std" ]; then
    echo "Installing Forge Standard Library..."
    git clone https://github.com/foundry-rs/forge-std.git lib/forge-std
    echo "✓ Forge Standard Library installed"
else
    echo "✓ Forge Standard Library already installed"
fi

#
# Compile and build contracts, push to anvil
#

# Check if Anvil is running
if ! nc -z localhost 8545 2>/dev/null; then
    echo -e "${RED}❌ Anvil is not running on port 8545${NC}"
    echo "Please start Anvil in another terminal:"
    echo "  anvil"
    exit 1
fi

echo -e "${GREEN}✓${NC} Anvil is running"

# Check if forge is installed
if ! command -v forge &> /dev/null; then
    echo -e "${RED}❌ Forge not found${NC}"
    echo "Please install Foundry: https://book.getfoundry.sh/getting-started/installation"
    exit 1
fi

echo -e "${GREEN}✓${NC} Forge is installed"
echo ""

#
# Deploy smart contracts
#

echo "📦 Deploying smart contracts..."
echo ""

export PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
forge script script/Deploy.s.sol --rpc-url http://localhost:8545 --broadcast > deployments.txt

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Deployment failed${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}✓${NC} Contracts deployed successfully!"
echo ""

#
# Build out frontend
#


if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ node/npm not found${NC}"
    exit 1
fi

cd ../frontend
npm install
npm run build


if [ ! -f "../contracts/deployments.txt" ]; then
    echo "Missing deployments file, did contracts deploy?"
    echo "❌ Unable to generate .env.local file!"
    exit 1
else
    echo "✓ Preparing .env.local file!"
    chmod 755 envbuilder.sh
    ./envbuilder.sh
fi



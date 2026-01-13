#!/bin/bash

# extract_addresses.sh - Extract contract addresses from deployment output

INPUT_FILE="../contracts/deployments.txt"
OUTPUT_FILE=".env.local"

# Check if input file exists
if [ ! -f "$INPUT_FILE" ]; then
    echo "Error: $INPUT_FILE not found!"
    exit 1
fi

# Extract addresses using grep and awk
MOCK_USDC=$(grep "MockUSDC deployed at:" "$INPUT_FILE" | awk '{print $NF}')
GROUP_PURCHASING=$(grep "GroupPurchasing deployed at:" "$INPUT_FILE" | awk '{print $NF}')
SHIPPING_ROUTES=$(grep "ShippingRoutes deployed at:" "$INPUT_FILE" | awk '{print $NF}')

# Validate that addresses were found
if [ -z "$MOCK_USDC" ] || [ -z "$GROUP_PURCHASING" ] || [ -z "$SHIPPING_ROUTES" ]; then
    echo "Error: Could not extract all addresses!"
    echo "MockUSDC: $MOCK_USDC"
    echo "GroupPurchasing: $GROUP_PURCHASING"
    echo "ShippingRoutes: $SHIPPING_ROUTES"
    exit 1
fi

# Write to .env.addresses
cat > "$OUTPUT_FILE" << EOF
NEXT_PUBLIC_MOCK_USDC_ADDRESS=$MOCK_USDC
NEXT_PUBLIC_GROUP_PURCHASING_ADDRESS=$GROUP_PURCHASING
NEXT_PUBLIC_SHIPPING_ROUTES_ADDRESS=$SHIPPING_ROUTES
EOF

echo "✅ Contract addresses extracted successfully:"
echo "   MockUSDC: $MOCK_USDC"
echo "   GroupPurchasing: $GROUP_PURCHASING"
echo "   ShippingRoutes: $SHIPPING_ROUTES"
echo ""
echo "================================================"
echo "   Configuration Setup"
echo "================================================"
echo ""

# Prompt for user inputs
read -p "Enter NEXT_PUBLIC_WEB3AUTH_CLIENT_ID: " WEB3AUTH_CLIENT_ID
read -p "Enter NEXT_PUBLIC_RPC_URL [default: http://127.0.0.1:8545]: " RPC_URL
RPC_URL=${RPC_URL:-http://127.0.0.1:8545}

read -p "Enter NEXT_PUBLIC_CHAIN_ID [default: 31337]: " CHAIN_ID
CHAIN_ID=${CHAIN_ID:-31337}

read -p "Enter ETH_FAUCET_PRIVATE_KEY: " ETH_FAUCET_KEY
read -p "Enter NEXT_PUBLIC_ANVIL_FAUCET_KEY: " ANVIL_FAUCET_KEY


read -p "Enter PUBLIC_IP: " PUBLIC_IP 

echo ""
echo "================================================"
echo "   Writing configuration to $OUTPUT_FILE"
echo "================================================"

# Write to .env.addresses
cat > "$OUTPUT_FILE" << EOF
# Contract Addresses
NEXT_PUBLIC_MOCK_USDC_ADDRESS=$MOCK_USDC
NEXT_PUBLIC_GROUP_PURCHASING_ADDRESS=$GROUP_PURCHASING
NEXT_PUBLIC_SHIPPING_ROUTES_ADDRESS=$SHIPPING_ROUTES

# Web3Auth Configuration
NEXT_PUBLIC_WEB3AUTH_CLIENT_ID=$WEB3AUTH_CLIENT_ID

# Blockchain Configuration
NEXT_PUBLIC_RPC_URL=$RPC_URL
NEXT_PUBLIC_CHAIN_ID=$CHAIN_ID

# Faucet Configuration (Server-side)
ETH_FAUCET_PRIVATE_KEY=$ETH_FAUCET_KEY
NEXT_PUBLIC_ANVIL_FAUCET_KEY=$ANVIL_FAUCET_KEY

# Public facing IP if needed
PUBLIC_IP=$PUBLIC_IP
EOF

echo ""
echo "✅ Configuration written successfully to $OUTPUT_FILE"
echo ""
echo "================================================"
echo "   Generated Configuration"
echo "================================================"
cat "$OUTPUT_FILE"
echo ""
echo "================================================"
echo "   Next Steps"
echo "================================================"
echo "1. Review the generated $OUTPUT_FILE"
echo "2. Run the command npm start"
echo "================================================"


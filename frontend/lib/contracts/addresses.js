// Contract addresses for Caribbean Trade Hub
export const CONTRACTS = {
  MOCK_USDC: process.env.NEXT_PUBLIC_MOCK_USDC_ADDRESS,
  GROUP_PURCHASING: process.env.NEXT_PUBLIC_GROUP_PURCHASING_ADDRESS,
  SHIPPING_ROUTES: process.env.NEXT_PUBLIC_SHIPPING_ROUTES_ADDRESS,
};

export const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL;
export const CHAIN_ID = parseInt(process.env.NEXT_PUBLIC_CHAIN_ID);

// Anvil Chain Config
export const ANVIL_CHAIN = {
  chainId: `0x${CHAIN_ID.toString(16)}`,
  chainName: 'Anvil Local',
  rpcTarget: RPC_URL,
  displayName: 'Anvil (Local)',
  blockExplorer: '',
  ticker: 'ETH',
  tickerName: 'Ethereum',
};

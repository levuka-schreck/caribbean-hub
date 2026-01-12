'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { Web3Auth } from '@web3auth/modal';
import { EthereumPrivateKeyProvider } from '@web3auth/ethereum-provider';
import { ethers } from 'ethers';
import { ANVIL_CHAIN, CHAIN_ID } from './contracts/addresses';

const Web3AuthContext = createContext(null);

export function Web3AuthProvider({ children }) {
  const [web3auth, setWeb3auth] = useState(null);
  const [provider, setProvider] = useState(null);
  const [address, setAddress] = useState(null);
  const [balance, setBalance] = useState('0');
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize Web3Auth
  useEffect(() => {
    const init = async () => {
      try {
        const chainConfig = {
          chainNamespace: 'eip155',
          chainId: ANVIL_CHAIN.chainId,
          rpcTarget: ANVIL_CHAIN.rpcTarget,
          displayName: ANVIL_CHAIN.displayName,
          blockExplorer: ANVIL_CHAIN.blockExplorer,
          ticker: ANVIL_CHAIN.ticker,
          tickerName: ANVIL_CHAIN.tickerName,
        };

        console.log('Initializing Web3Auth with config:', {
          clientId: process.env.NEXT_PUBLIC_WEB3AUTH_CLIENT_ID?.substring(0, 10) + '...',
          network: 'sapphire_mainnet',
          chainId: chainConfig.chainId,
          rpcTarget: chainConfig.rpcTarget,
        });

        const privateKeyProvider = new EthereumPrivateKeyProvider({
          config: { chainConfig },
        });

        const web3AuthInstance = new Web3Auth({
          clientId: process.env.NEXT_PUBLIC_WEB3AUTH_CLIENT_ID,
          web3AuthNetwork: 'sapphire_mainnet',
          privateKeyProvider,
        });

        await web3AuthInstance.initModal();
        setWeb3auth(web3AuthInstance);

        // Auto-connect if previously connected
        if (web3AuthInstance.connected) {
          const web3authProvider = web3AuthInstance.provider;
          const ethersProvider = new ethers.BrowserProvider(web3authProvider);
          const signer = await ethersProvider.getSigner();
          const userAddress = await signer.getAddress();
          const userBalance = await ethersProvider.getBalance(userAddress);

          setProvider(ethersProvider);
          setAddress(userAddress);
          setBalance(ethers.formatEther(userBalance));
          setIsConnected(true);
        }
      } catch (error) {
        console.error('Web3Auth init error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    init();
  }, []);

  // Connect wallet
  const connect = async () => {
    if (!web3auth) {
      console.error('Web3Auth not initialized');
      return;
    }

    try {
      const web3authProvider = await web3auth.connect();
      const ethersProvider = new ethers.BrowserProvider(web3authProvider);
      const signer = await ethersProvider.getSigner();
      const userAddress = await signer.getAddress();
      const userBalance = await ethersProvider.getBalance(userAddress);

      setProvider(ethersProvider);
      setAddress(userAddress);
      setBalance(ethers.formatEther(userBalance));
      setIsConnected(true);
    } catch (error) {
      console.error('Connection error:', error);
    }
  };

  // Disconnect wallet
  const disconnect = async () => {
    if (!web3auth) return;

    try {
      await web3auth.logout();
      setProvider(null);
      setAddress(null);
      setBalance('0');
      setIsConnected(false);
    } catch (error) {
      console.error('Disconnect error:', error);
    }
  };

  // Refresh balance
  const refreshBalance = async () => {
    if (!provider || !address) return;

    try {
      const userBalance = await provider.getBalance(address);
      setBalance(ethers.formatEther(userBalance));
    } catch (error) {
      console.error('Balance refresh error:', error);
    }
  };

  // Get signer
  const getSigner = async () => {
    if (!provider) return null;
    return await provider.getSigner();
  };

  const value = {
    web3auth,
    provider,
    address,
    balance,
    isConnected,
    isLoading,
    connect,
    disconnect,
    refreshBalance,
    getSigner,
  };

  return (
    <Web3AuthContext.Provider value={value}>
      {children}
    </Web3AuthContext.Provider>
  );
}

export function useWeb3Auth() {
  const context = useContext(Web3AuthContext);
  if (!context) {
    throw new Error('useWeb3Auth must be used within Web3AuthProvider');
  }
  return context;
}

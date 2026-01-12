'use client';

import { useState, useCallback } from 'react';
import { ethers } from 'ethers';
import { useWeb3Auth } from '../Web3AuthContext';
import { CONTRACTS } from '../contracts/addresses';
import MockUSDCABI from '../contracts/MockUSDC.json';

export function useFaucets() {
  const { provider, address, getSigner, refreshBalance } = useWeb3Auth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // USDC Faucet - Mint 1M USDC
  const requestUSDC = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (!provider || !address) {
        throw new Error('Wallet not connected');
      }

      const signer = await getSigner();
      const usdcContract = new ethers.Contract(
        CONTRACTS.MOCK_USDC,
        MockUSDCABI.abi,
        signer
      );

      const tx = await usdcContract.faucet({
        maxFeePerGas: ethers.parseUnits("2", "gwei"),
        maxPriorityFeePerGas: ethers.parseUnits("1", "gwei")
      });
      const receipt = await tx.wait();

      return { 
        success: true, 
        amount: '1000000', 
        receipt,
        message: '1M USDC minted successfully!'
      };
    } catch (err) {
      console.error('USDC faucet error:', err);
      setError(err.message);
      return { 
        success: false, 
        error: err.message,
        message: 'Failed to mint USDC'
      };
    } finally {
      setLoading(false);
    }
  }, [provider, address, getSigner]);

  // ETH Faucet - Request ETH from funded account
  const requestETH = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (!address) {
        throw new Error('Wallet not connected');
      }

      // Call backend API route to send ETH
      const response = await fetch('/api/faucet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'ETH faucet request failed');
      }

      // Refresh wallet balance
      await refreshBalance();

      return {
        success: true,
        amount: '100',
        txHash: data.txHash,
        message: '100 ETH sent successfully!'
      };
    } catch (err) {
      console.error('ETH faucet error:', err);
      setError(err.message);
      return {
        success: false,
        error: err.message,
        message: 'Failed to send ETH'
      };
    } finally {
      setLoading(false);
    }
  }, [address, refreshBalance]);

  // Get USDC balance
  const getUSDCBalance = useCallback(async () => {
    if (!provider || !address) return '0';

    try {
      const usdcContract = new ethers.Contract(
        CONTRACTS.MOCK_USDC,
        MockUSDCABI.abi,
        provider
      );

      const balance = await usdcContract.balanceOf(address);
      return ethers.formatUnits(balance, 6); // USDC has 6 decimals
    } catch (err) {
      console.error('Error fetching USDC balance:', err);
      return '0';
    }
  }, [provider, address]);

  return {
    loading,
    error,
    requestUSDC,
    requestETH,
    getUSDCBalance,
  };
}

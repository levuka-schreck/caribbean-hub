'use client';

import { useState, useEffect } from 'react';
import { useWeb3Auth } from '@/lib/Web3AuthContext';
import { useFaucets } from '@/lib/hooks/useFaucets';

export default function ConnectButton() {
  const { address, balance, isConnected, isLoading, connect, disconnect } = useWeb3Auth();
  const { requestUSDC, requestETH, getUSDCBalance, loading: faucetLoading } = useFaucets();
  const [usdcBalance, setUsdcBalance] = useState('0');
  const [showWidget, setShowWidget] = useState(false);
  const [message, setMessage] = useState('');

  // Load USDC balance
  useEffect(() => {
    if (isConnected) {
      loadUSDCBalance();
    }
  }, [isConnected]);

  const loadUSDCBalance = async () => {
    const balance = await getUSDCBalance();
    setUsdcBalance(balance);
  };

  const handleUSDCFaucet = async () => {
    const result = await requestUSDC();
    setMessage(result.message);
    if (result.success) {
      await loadUSDCBalance();
    }
    setTimeout(() => setMessage(''), 3000);
  };

  const handleETHFaucet = async () => {
    const result = await requestETH();
    setMessage(result.message);
    setTimeout(() => setMessage(''), 3000);
  };

  if (isLoading) {
    return (
      <button className="px-4 py-2 bg-gray-700 text-gray-400 rounded-lg cursor-not-allowed">
        Loading...
      </button>
    );
  }

  if (!isConnected) {
    return (
      <button
        onClick={connect}
        className="px-6 py-2 bg-gradient-to-r from-cyan-500 to-purple-600 text-white font-semibold rounded-lg hover:shadow-lg hover:shadow-cyan-500/50 transition-all"
      >
        Connect Wallet
      </button>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setShowWidget(!showWidget)}
        className="px-4 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg hover:border-cyan-500 transition-all"
      >
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-green-400 rounded-full"></div>
          <span className="font-mono text-sm">
            {address?.slice(0, 6)}...{address?.slice(-4)}
          </span>
        </div>
      </button>

      {/* Wallet Widget */}
      {showWidget && (
        <div className="absolute right-0 mt-2 w-80 bg-gray-800 border border-gray-700 rounded-xl shadow-xl p-4 z-50">
          <div className="space-y-4">
            {/* Address */}
            <div>
              <div className="text-xs text-gray-400 mb-1">Wallet Address</div>
              <div className="font-mono text-sm text-white bg-gray-900 px-3 py-2 rounded-lg">
                {address}
              </div>
            </div>

            {/* Balances */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gray-900 rounded-lg p-3">
                <div className="text-xs text-gray-400 mb-1">ETH Balance</div>
                <div className="text-lg font-bold text-white">
                  {parseFloat(balance).toFixed(4)}
                </div>
              </div>
              <div className="bg-gray-900 rounded-lg p-3">
                <div className="text-xs text-gray-400 mb-1">USDC Balance</div>
                <div className="text-lg font-bold text-cyan-400">
                  {parseFloat(usdcBalance).toLocaleString()}
                </div>
              </div>
            </div>

            {/* Faucets */}
            <div>
              <div className="text-xs text-gray-400 mb-2">Test Faucets</div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={handleETHFaucet}
                  disabled={faucetLoading}
                  className="px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm rounded-lg disabled:opacity-50 transition-all"
                >
                  Get 100 ETH
                </button>
                <button
                  onClick={handleUSDCFaucet}
                  disabled={faucetLoading}
                  className="px-3 py-2 bg-cyan-600 hover:bg-cyan-700 text-white text-sm rounded-lg disabled:opacity-50 transition-all"
                >
                  Get 1M USDC
                </button>
              </div>
            </div>

            {/* Message */}
            {message && (
              <div className="text-xs text-center text-green-400 bg-green-400/10 px-3 py-2 rounded-lg">
                {message}
              </div>
            )}

            {/* Disconnect */}
            <button
              onClick={disconnect}
              className="w-full px-4 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg transition-all"
            >
              Disconnect
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

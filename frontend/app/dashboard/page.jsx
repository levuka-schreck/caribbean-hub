'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useWeb3Auth } from '@/lib/Web3AuthContext';
import { useCampaigns } from '@/lib/hooks/useCampaigns';
import { useFaucets } from '@/lib/hooks/useFaucets';
import CampaignCard from '@/components/campaigns/CampaignCard';

export default function DashboardPage() {
  const { isConnected, address, balance } = useWeb3Auth();
  const { getAllCampaigns } = useCampaigns();
  const { getUSDCBalance } = useFaucets();
  const [usdcBalance, setUsdcBalance] = useState('0');
  const [myCampaigns, setMyCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copySuccess, setCopySuccess] = useState(false);

  useEffect(() => {
    if (isConnected) {
      loadData();
    }
  }, [isConnected, address]);

  const loadData = async () => {
    setLoading(true);
    
    try {
      // Load USDC balance
      const usdc = await getUSDCBalance();
      setUsdcBalance(usdc);
      
      // Load campaigns created by user
      const allCampaigns = await getAllCampaigns();
      const userCampaigns = allCampaigns.filter(
        c => c.creator && address && 
             typeof c.creator === 'string' && 
             typeof address === 'string' &&
             c.creator.toLowerCase() === address.toLowerCase()
      );
      setMyCampaigns(userCampaigns);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      setUsdcBalance('0');
      setMyCampaigns([]);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(address);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  if (!isConnected) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-gray-800 rounded-xl p-12 border border-gray-700 text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Wallet Not Connected</h2>
          <p className="text-gray-400 mb-6">
            Please connect your wallet to view your dashboard
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-cyan-400 text-xl">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold text-white mb-2">Dashboard</h1>
        <p className="text-gray-400">Manage your campaigns and view your activity</p>
      </div>

      {/* Wallet Info */}
      <div className="grid md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-cyan-500/20 to-cyan-600/20 rounded-xl p-6 border border-cyan-500/50">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm text-gray-400">Wallet Address</div>
            <button
              onClick={copyToClipboard}
              className="px-3 py-1 bg-cyan-600 hover:bg-cyan-700 text-white text-xs rounded transition-all"
            >
              {copySuccess ? '✓ Copied!' : 'Copy'}
            </button>
          </div>
          <div className="text-xl font-bold text-white break-all">
            {`${address?.slice(0, 10)}...${address?.slice(-8)}`}
          </div>
        </div>
        <WalletCard
          title="ETH Balance"
          value={`${parseFloat(balance).toFixed(4)} ETH`}
          color="purple"
        />
        <WalletCard
          title="USDC Balance"
          value={`${parseFloat(usdcBalance).toLocaleString()} USDC`}
          color="cyan"
        />
      </div>

      {/* Quick Actions */}
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <h2 className="text-xl font-bold text-white mb-4">Quick Actions</h2>
        <div className="grid md:grid-cols-3 gap-4">
          <Link
            href="/campaigns/create"
            className="p-4 bg-gradient-to-r from-cyan-500/20 to-purple-600/20 border border-cyan-500/50 rounded-lg hover:border-cyan-400 transition-all text-center"
          >
            <div className="text-3xl mb-2">📦</div>
            <div className="text-white font-semibold">Create Campaign</div>
          </Link>
          <Link
            href="/campaigns"
            className="p-4 bg-gradient-to-r from-cyan-500/20 to-purple-600/20 border border-purple-500/50 rounded-lg hover:border-purple-400 transition-all text-center"
          >
            <div className="text-3xl mb-2">🔍</div>
            <div className="text-white font-semibold">Browse Campaigns</div>
          </Link>
          <Link
            href="/shipping"
            className="p-4 bg-gradient-to-r from-cyan-500/20 to-purple-600/20 border border-cyan-500/50 rounded-lg hover:border-cyan-400 transition-all text-center"
          >
            <div className="text-3xl mb-2">🚢</div>
            <div className="text-white font-semibold">Shipping Routes</div>
          </Link>
        </div>
      </div>

      {/* My Campaigns */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">My Campaigns</h2>
          <div className="text-gray-400 text-sm">
            {myCampaigns.length} campaign{myCampaigns.length !== 1 ? 's' : ''}
          </div>
        </div>

        {myCampaigns.length === 0 ? (
          <div className="bg-gray-800 rounded-xl p-12 border border-gray-700 text-center">
            <div className="text-gray-400 mb-4">You haven't created any campaigns yet</div>
            <Link
              href="/campaigns/create"
              className="inline-block px-6 py-3 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg transition-all"
            >
              Create Your First Campaign
            </Link>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {myCampaigns.map(campaign => (
              <CampaignCard key={campaign.id} campaign={campaign} />
            ))}
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="bg-gray-800 rounded-xl p-8 border border-gray-700">
        <h2 className="text-xl font-bold text-white mb-6">Your Stats</h2>
        <div className="grid md:grid-cols-4 gap-8">
          <StatCard label="Campaigns Created" value={myCampaigns.length.toString()} />
          <StatCard
            label="Active Campaigns"
            value={myCampaigns.filter(c => c.status === 0).length.toString()}
          />
          <StatCard
            label="Funded Campaigns"
            value={myCampaigns.filter(c => c.status === 1).length.toString()}
          />
          <StatCard
            label="Completed Campaigns"
            value={myCampaigns.filter(c => c.status === 3).length.toString()}
          />
        </div>
      </div>
    </div>
  );
}

function WalletCard({ title, value, color }) {
  const colorClasses = {
    cyan: 'from-cyan-500/20 to-cyan-600/20 border-cyan-500/50',
    purple: 'from-purple-500/20 to-purple-600/20 border-purple-500/50',
  };

  return (
    <div className={`bg-gradient-to-br ${colorClasses[color]} rounded-xl p-6 border`}>
      <div className="text-sm text-gray-400 mb-2">{title}</div>
      <div className="text-xl font-bold text-white break-all">{value}</div>
    </div>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="text-center">
      <div className="text-3xl font-bold text-cyan-400 mb-1">{value}</div>
      <div className="text-sm text-gray-400">{label}</div>
    </div>
  );
}

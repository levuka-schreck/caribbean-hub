'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useCampaigns } from '@/lib/hooks/useCampaigns';
import { useWeb3Auth } from '@/lib/Web3AuthContext';
import CampaignCard from '@/components/campaigns/CampaignCard';
import { CAMPAIGN_STATUS } from '@/lib/data/ports';

export default function CampaignsPage() {
  const { getAllCampaigns } = useCampaigns();
  const { isConnected } = useWeb3Auth();
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, product, container
  const [statusFilter, setStatusFilter] = useState('all'); // all, active, funded, etc.
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadCampaigns();
  }, []);

  const loadCampaigns = async () => {
    setLoading(true);
    try {
      const data = await getAllCampaigns();
      setCampaigns(data);
    } catch (error) {
      console.error('Error loading campaigns:', error);
      setCampaigns([]);
    } finally {
      setLoading(false);
    }
  };

  // Filter campaigns
  const filteredCampaigns = campaigns.filter(campaign => {
    // Type filter
    if (filter === 'product' && campaign.campaignType !== 0) return false;
    if (filter === 'container' && campaign.campaignType !== 1) return false;
    
    // Status filter
    if (statusFilter !== 'all' && campaign.status !== parseInt(statusFilter)) return false;
    
    // Search filter
    if (searchTerm && !campaign.name.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    
    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-cyan-400 text-xl">Loading campaigns...</div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold text-white mb-2">Browse Campaigns</h1>
          <p className="text-gray-400">
            Join active campaigns or create your own
          </p>
        </div>
        {isConnected && (
          <Link
            href="/campaigns/create"
            className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-purple-600 text-white font-semibold rounded-lg hover:shadow-lg hover:shadow-cyan-500/50 transition-all"
          >
            Create Campaign
          </Link>
        )}
      </div>

      {/* Filters */}
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <div className="grid md:grid-cols-3 gap-4">
          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Search
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search campaigns..."
              className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:border-cyan-500 focus:outline-none"
            />
          </div>

          {/* Type Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Type
            </label>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:border-cyan-500 focus:outline-none"
            >
              <option value="all">All Types</option>
              <option value="product">Product Campaigns</option>
              <option value="container">Container Campaigns</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:border-cyan-500 focus:outline-none"
            >
              <option value="all">All Statuses</option>
              {CAMPAIGN_STATUS.map(status => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Results Count */}
      <div className="text-gray-400 text-sm">
        Showing {filteredCampaigns.length} of {campaigns.length} campaigns
      </div>

      {/* Campaigns Grid */}
      {filteredCampaigns.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-gray-400 text-lg mb-4">No campaigns found</div>
          {isConnected && (
            <Link
              href="/campaigns/create"
              className="inline-block px-6 py-3 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg transition-all"
            >
              Create First Campaign
            </Link>
          )}
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCampaigns.map(campaign => (
            <CampaignCard key={campaign.id} campaign={campaign} />
          ))}
        </div>
      )}
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useWeb3Auth } from '@/lib/Web3AuthContext';
import { useCampaigns } from '@/lib/hooks/useCampaigns';
import { useRoutes } from '@/lib/hooks/useRoutes';

export default function HomePage() {
  const { isConnected } = useWeb3Auth();
  const { getAllCampaigns } = useCampaigns();
  const { getActiveRoutes } = useRoutes();
  
  const [stats, setStats] = useState({
    activeCampaigns: 0,
    totalVolume: '$0',
    shippingRoutes: 0,
    portPartners: 0,
    loading: true
  });

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      // Fetch campaigns
      const campaigns = await getAllCampaigns();
      const activeCampaigns = campaigns.filter(c => c.status === 0).length; // Status 0 = Active
      
      // Calculate total volume from funded (status 1) and completed (status 3) campaigns only
      const totalVolume = campaigns
        .filter(c => c.status === 1 || c.status === 3)
        .reduce((sum, c) => {
          return sum + parseFloat(c.currentAmount || 0);
        }, 0);
      
      // Fetch routes - with error handling
      let shippingRoutes = 0;
      let portsSet = new Set();
      
      try {
        const routes = await getActiveRoutes();
        shippingRoutes = routes.length;
        
        // Count unique ports from routes
        routes.forEach(route => {
          // Add departure port
          if (route.departurePort) portsSet.add(route.departurePort);
          // Add all destination ports
          if (route.ports && route.ports.length > 0) {
            route.ports.forEach(port => {
              if (port.name) portsSet.add(port.name);
            });
          }
        });
      } catch (routeError) {
        console.warn('Could not load routes for stats:', routeError);
        // Continue without route stats
      }
      
      // Add campaign ports
      campaigns.forEach(campaign => {
        if (campaign.originPort) portsSet.add(campaign.originPort);
        if (campaign.destinationPort) portsSet.add(campaign.destinationPort);
      });
      
      setStats({
        activeCampaigns,
        totalVolume: `$${totalVolume.toLocaleString()}`,
        shippingRoutes,
        portPartners: portsSet.size,
        loading: false
      });
    } catch (error) {
      console.error('Error loading stats:', error);
      setStats(prev => ({ ...prev, loading: false }));
    }
  };

  return (
    <div className="space-y-16">
      {/* Hero Section */}
      <section className="text-center py-20">
        <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
          Caribbean Trade Hub
        </h1>
        <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
          Decentralized group purchasing and shipping platform connecting Caribbean nations
          with efficient, transparent trade solutions.
        </p>
        <div className="flex flex-wrap gap-4 justify-center">
          <Link
            href="/campaigns"
            className="px-8 py-3 bg-gradient-to-r from-cyan-500 to-purple-600 text-white font-semibold rounded-lg hover:shadow-lg hover:shadow-cyan-500/50 transition-all"
          >
            Browse Campaigns
          </Link>
          {isConnected && (
            <Link
              href="/campaigns/create"
              className="px-8 py-3 bg-gray-800 border border-gray-700 text-white font-semibold rounded-lg hover:border-cyan-500 transition-all"
            >
              Create Campaign
            </Link>
          )}
        </div>
      </section>

      {/* Features */}
      <section className="grid md:grid-cols-3 gap-8">
        <FeatureCard
          title="Group Purchasing"
          description="Pool resources with others to unlock wholesale pricing and reduce costs on essential goods."
          icon="🛒"
        />
        <FeatureCard
          title="Container Shipping"
          description="Consolidate cargo efficiently with shared container campaigns for maximum space utilization."
          icon="🚢"
        />
        <FeatureCard
          title="Transparent Tracking"
          description="Real-time shipment tracking with blockchain-verified updates at every port of call."
          icon="📍"
        />
      </section>

      {/* Stats */}
      <section className="bg-gray-800/50 rounded-xl p-8 border border-gray-700">
        <div className="grid md:grid-cols-4 gap-8 text-center">
          <StatCard 
            label="Active Campaigns" 
            value={stats.loading ? '...' : stats.activeCampaigns} 
          />
          <StatCard 
            label="Total Volume" 
            value={stats.loading ? '...' : stats.totalVolume} 
          />
          <StatCard 
            label="Shipping Routes" 
            value={stats.loading ? '...' : stats.shippingRoutes} 
          />
          <StatCard 
            label="Port Partners" 
            value={stats.loading ? '...' : stats.portPartners} 
          />
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gradient-to-r from-cyan-500/10 to-purple-600/10 rounded-xl p-12 border border-cyan-500/20 text-center">
        <h2 className="text-3xl font-bold mb-4">Ready to Start Trading?</h2>
        <p className="text-gray-300 mb-6 max-w-xl mx-auto">
          Connect your wallet to join campaigns, create shipping routes, and participate in
          Caribbean trade.
        </p>
        {!isConnected && (
          <p className="text-cyan-400 font-semibold">
            Click "Connect Wallet" in the top right to get started
          </p>
        )}
      </section>
    </div>
  );
}

function FeatureCard({ title, description, icon }) {
  return (
    <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 hover:border-cyan-500 transition-all">
      <div className="text-4xl mb-4">{icon}</div>
      <h3 className="text-xl font-bold mb-2 text-white">{title}</h3>
      <p className="text-gray-400">{description}</p>
    </div>
  );
}

function StatCard({ label, value }) {
  return (
    <div>
      <div className="text-3xl font-bold text-cyan-400 mb-1">{value}</div>
      <div className="text-gray-400">{label}</div>
    </div>
  );
}


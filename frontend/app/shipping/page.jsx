'use client';

import { useState, useEffect } from 'react';
import { useRoutes } from '@/lib/hooks/useRoutes';
import { useWeb3Auth } from '@/lib/Web3AuthContext';
import CreateRouteForm from '@/components/shipping/CreateRouteForm';
import RoutesList from '@/components/shipping/RoutesList';

export default function ShippingPage() {
  const { getActiveRoutes } = useRoutes();
  const { isConnected } = useWeb3Auth();
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);

  useEffect(() => {
    loadRoutes();
  }, []);

  const loadRoutes = async () => {
    setLoading(true);
    try {
      const data = await getActiveRoutes();
      setRoutes(data);
    } catch (error) {
      console.error('Error loading routes:', error);
      setRoutes([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  const handleRouteCreated = async () => {
    await loadRoutes();
    setShowCreateForm(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-cyan-400 text-xl">Loading routes...</div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold text-white mb-2">Shipping Routes</h1>
          <p className="text-gray-400">
            Active shipping routes and container assignments
          </p>
        </div>
        {isConnected && (
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-purple-600 text-white font-semibold rounded-lg hover:shadow-lg hover:shadow-cyan-500/50 transition-all"
          >
            {showCreateForm ? 'Cancel' : 'Create Route'}
          </button>
        )}
      </div>

      {/* Create Route Form */}
      {showCreateForm && (
        <div className="bg-gray-800 rounded-xl p-8 border border-cyan-500/50">
          <h2 className="text-2xl font-bold text-white mb-6">Create Shipping Route</h2>
          <CreateRouteForm onSuccess={handleRouteCreated} />
        </div>
      )}

      {/* Routes List */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">Active Routes</h2>
          <div className="text-gray-400 text-sm">
            {routes.length} route{routes.length !== 1 ? 's' : ''} found
          </div>
        </div>

        <RoutesList routes={routes} onRoutesUpdate={loadRoutes} />
      </div>

      {/* Info Card */}
      <div className="bg-gradient-to-r from-cyan-500/10 to-purple-600/10 rounded-xl p-8 border border-cyan-500/20">
        <h3 className="text-xl font-bold text-white mb-3">About Shipping Routes</h3>
        <div className="text-gray-300 space-y-2 text-sm">
          <p>
            • Shipping routes connect multiple ports in the Caribbean and US
          </p>
          <p>
            • Create routes to manage container shipments and track progress
          </p>
          <p>
            • Assign funded container campaigns to routes for consolidated shipping
          </p>
          <p>
            • Track route status, port visits, and current location in real-time
          </p>
        </div>
      </div>

      {/* Connect Prompt */}
      {!isConnected && (
        <div className="bg-cyan-500/10 rounded-xl p-6 border border-cyan-500/50 text-center">
          <p className="text-cyan-400 font-semibold">
            Connect your wallet to create shipping routes
          </p>
        </div>
      )}
    </div>
  );
}

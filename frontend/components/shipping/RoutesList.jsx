'use client';

import { useState, useEffect } from 'react';
import { useCampaigns } from '@/lib/hooks/useCampaigns';
import { useRoutes } from '@/lib/hooks/useRoutes';
import { ROUTE_STATUS, REFRIGERATION_TYPES } from '@/lib/data/ports';

export default function RoutesList({ routes, onRouteSelect, onRoutesUpdate }) {
  const [availableCampaigns, setAvailableCampaigns] = useState([]);
  const [assignedCampaignIds, setAssignedCampaignIds] = useState(new Set());
  const { getAllCampaigns } = useCampaigns();

  useEffect(() => {
    loadAvailableCampaigns();
  }, [routes]);

  const loadAvailableCampaigns = async () => {
    try {
      const campaigns = await getAllCampaigns();
      
      // Filter for funded (status 1) or completed (status 3) campaigns
      const eligibleCampaigns = campaigns.filter(c => 
        c.status === 1 || c.status === 3
      );
      
      setAvailableCampaigns(eligibleCampaigns);
      
      // Build set of already assigned campaign IDs from all routes
      const assigned = new Set();
      routes.forEach(route => {
        if (route.assignedCampaigns && route.assignedCampaigns.length > 0) {
          route.assignedCampaigns.forEach(id => {
            // Only add non-zero IDs
            if (id && id !== '0' && id !== '') {
              assigned.add(id);
            }
          });
        }
      });
      
      setAssignedCampaignIds(assigned);
    } catch (error) {
      console.error('Error loading campaigns:', error);
    }
  };

  if (routes.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-800 rounded-xl border border-gray-700">
        <div className="text-gray-400">No active routes found</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {routes.map(route => (
        <RouteCard 
          key={route.id} 
          route={route} 
          onSelect={onRouteSelect}
          availableCampaigns={availableCampaigns}
          assignedCampaignIds={assignedCampaignIds}
          onCampaignAssigned={onRoutesUpdate}
        />
      ))}
    </div>
  );
}

function RouteCard({ route, onSelect, availableCampaigns, assignedCampaignIds, onCampaignAssigned }) {
  const { assignCampaignToRoute } = useRoutes();
  const { getAllCampaigns } = useCampaigns();
  const [selectedCampaignId, setSelectedCampaignId] = useState('');
  const [assigning, setAssigning] = useState(false);
  const [campaignDetails, setCampaignDetails] = useState({});

  const status = ROUTE_STATUS.find(s => s.value === Number(route.status)) || ROUTE_STATUS[0];
  const refrigeration = REFRIGERATION_TYPES.find(r => r.value === route.refrigerationType);
  const nextPort = route.ports?.find(p => !p.visited);

  // Load full campaign details for assigned campaigns
  useEffect(() => {
    if (route.assignedCampaigns && route.assignedCampaigns.length > 0) {
      loadCampaignDetails();
    }
  }, [route.assignedCampaigns]);

  const loadCampaignDetails = async () => {
    try {
      const campaigns = await getAllCampaigns();
      const details = {};
      
      route.assignedCampaigns.forEach(id => {
        const campaign = campaigns.find(c => 
          c.id.toString() === id.toString()
        );
        
        if (campaign) {
          details[id] = campaign;
        }
      });
      
      setCampaignDetails(details);
    } catch (error) {
      console.error('Error loading campaign details:', error);
    }
  };

  // Get campaigns available for THIS route (not assigned to any route including this one)
  const getAvailableForRoute = () => {
    return availableCampaigns.filter(campaign => 
      !assignedCampaignIds.has(campaign.id)
    );
  };

  const handleAssignCampaign = async () => {
    if (!selectedCampaignId) return;
    
    setAssigning(true);
    try {
      // For now, use default values for container count and refrigeration
      // In a full implementation, these could be input fields
      const result = await assignCampaignToRoute(
        selectedCampaignId,
        route.id,
        1, // containerCount - default to 1
        route.refrigerationType > 0, // requiresRefrigeration - based on route
        `Campaign ${selectedCampaignId} assigned to route ${route.id}`
      );
      
      if (result.success) {
        alert('Campaign assigned successfully!');
        setSelectedCampaignId('');
        if (onCampaignAssigned) {
          onCampaignAssigned(); // Refresh routes list
        }
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (error) {
      console.error('Error assigning campaign:', error);
      alert(`Error: ${error.message}`);
    } finally {
      setAssigning(false);
    }
  };
  
  // Use proper Tailwind classes instead of dynamic ones
  const statusColors = {
    blue: 'bg-blue-500/20 text-blue-400',
    cyan: 'bg-cyan-500/20 text-cyan-400',
    green: 'bg-green-500/20 text-green-400',
  };
  const statusClass = statusColors[status.color] || statusColors.blue;

  return (
    <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 hover:border-cyan-500 transition-all">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-xl font-bold text-white">{route.shipName}</h3>
            <span className={`px-2 py-1 rounded text-xs font-semibold ${statusClass}`}>
              {status.label}
            </span>
          </div>
          <p className="text-sm text-gray-400 mb-2">{route.description}</p>
          <div className="text-xs text-gray-500">Ship ID: {route.shipId}</div>
        </div>
      </div>

      {/* Route Details */}
      <div className="grid md:grid-cols-3 gap-4 mb-4">
        <div>
          <div className="text-xs text-gray-400 mb-1">Departure</div>
          <div className="text-white font-semibold">{route.departurePort}</div>
        </div>
        <div>
          <div className="text-xs text-gray-400 mb-1">Capacity</div>
          <div className="text-white font-semibold">{route.capacity} TEU</div>
        </div>
        <div>
          <div className="text-xs text-gray-400 mb-1">Refrigeration</div>
          <div className="text-white font-semibold">{refrigeration?.label}</div>
        </div>
      </div>

      {/* Current Status */}
      {route.status === 1 && route.currentLocation && (
        <div className="mb-4 p-3 bg-cyan-500/10 rounded-lg border border-cyan-500/30">
          <div className="text-xs text-gray-400 mb-1">Current Location</div>
          <div className="text-cyan-400 font-semibold">{route.currentLocation}</div>
        </div>
      )}

      {/* Next Port */}
      {nextPort && (
        <div className="mb-4 p-3 bg-purple-500/10 rounded-lg border border-purple-500/30">
          <div className="text-xs text-gray-400 mb-1">Next Destination</div>
          <div className="text-purple-400 font-semibold">
            {nextPort.name}, {nextPort.country}
          </div>
          <div className="text-xs text-gray-400 mt-1">
            ETA: {nextPort.arrivalTime.toLocaleDateString()}
          </div>
        </div>
      )}

      {/* Port Stops */}
      {route.ports && route.ports.length > 0 && (
        <div className="mb-4">
          <div className="text-xs text-gray-400 mb-2">Port Stops</div>
          <div className="space-y-2">
            {route.ports.map((port, index) => (
              <div
                key={index}
                className={`px-3 py-2 rounded-lg text-sm ${
                  port.visited
                    ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                    : 'bg-gray-700 text-gray-300 border border-gray-600'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold">
                    {port.name}, {port.country}
                    {port.visited && ' ✓'}
                  </span>
                  <span className="text-xs opacity-75">
                    {port.arrivalTime ? new Date(port.arrivalTime).toLocaleString() : 'TBD'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Assigned Campaigns */}
      {route.assignedCampaigns && route.assignedCampaigns.length > 0 && (
        <div className="mb-4">
          <div className="text-xs text-gray-400 mb-2">Assigned Campaigns</div>
          <div className="space-y-2">
            {route.assignedCampaigns.map(campaignId => {
              const campaign = campaignDetails[campaignId];
              return (
                <div key={campaignId} className="p-3 bg-green-500/10 rounded-lg border border-green-500/30">
                  {campaign ? (
                    <>
                      <div className="text-green-400 font-semibold text-base">{campaign.name}</div>
                      <div className="text-xs text-gray-400 mt-1">
                        {campaign.campaignType === 0 ? 'Product' : 'Container'} Campaign • 
                        {campaign.status === 1 ? ' Funded' : campaign.status === 3 ? ' Completed' : ` Status ${campaign.status}`}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        Campaign ID: {campaignId}
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="text-yellow-400 font-semibold">Campaign ID: {campaignId}</div>
                      <div className="text-xs text-gray-500 mt-1">Loading details...</div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Campaign Assignment */}
      <div className="mb-4">
        <div className="text-xs text-gray-400 mb-2">Assign Campaign to Route</div>
        <div className="flex gap-2">
          <select
            value={selectedCampaignId}
            onChange={(e) => setSelectedCampaignId(e.target.value)}
            disabled={assigning}
            className="flex-1 px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white text-sm focus:border-cyan-500 focus:outline-none disabled:opacity-50"
          >
            <option value="">Select Campaign...</option>
            {getAvailableForRoute().map(campaign => (
              <option key={campaign.id} value={campaign.id}>
                {campaign.name} - {campaign.campaignType === 0 ? 'Product' : 'Container'}
                {campaign.status === 1 ? ' (Funded)' : ' (Completed)'}
              </option>
            ))}
          </select>
          <button
            onClick={handleAssignCampaign}
            disabled={!selectedCampaignId || assigning}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {assigning ? 'Assigning...' : 'Assign'}
          </button>
        </div>
        {getAvailableForRoute().length === 0 && (
          <div className="text-xs text-gray-500 mt-2">
            No available campaigns (all funded/completed campaigns are assigned to routes)
          </div>
        )}
      </div>

      {/* Action Button */}
      {onSelect && (
        <button
          onClick={() => onSelect(route)}
          className="w-full px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg transition-all"
        >
          View Details
        </button>
      )}
    </div>
  );
}

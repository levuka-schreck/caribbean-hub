'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useCampaigns } from '@/lib/hooks/useCampaigns';
import { useWeb3Auth } from '@/lib/Web3AuthContext';
import { CAMPAIGN_STATUS, DIRECTION_TYPES } from '@/lib/data/ports';

export default function CampaignDetailPage() {
  const params = useParams();
  const { getCampaign, getContainerRequirements, joinProductCampaign, joinContainerCampaign, cancelCampaign, loading, hasInfiniteApproval, checkApproval, approveUSDC } = useCampaigns();
  const { isConnected, address } = useWeb3Auth();
  const [campaign, setCampaign] = useState(null);
  const [containerReqs, setContainerReqs] = useState(null);
  const [loadingData, setLoadingData] = useState(true);
  
  // Join form state
  const [quantity, setQuantity] = useState(1);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [weightKg, setWeightKg] = useState('');
  const [shippingAddress, setShippingAddress] = useState('');

  useEffect(() => {
    loadCampaign();
  }, [params.id]);
  
  // Check approval status on mount
  useEffect(() => {
    if (isConnected) {
      checkApproval();
    }
  }, [isConnected, checkApproval]);
  
  // Auto-calculate payment for container campaigns based on weight
  useEffect(() => {
    console.log('=== CONTAINER AUTO-CALC useEffect ===');
    console.log('campaign:', campaign);
    console.log('campaign?.campaignType:', campaign?.campaignType);
    console.log('containerReqs:', containerReqs);
    console.log('weightKg:', weightKg);
    
    // campaignType === 1 is CONTAINER
    if (campaign && campaign.campaignType === 1 && containerReqs && weightKg) {
      console.log('All conditions met for auto-calculation!');
      const maxWeight = parseFloat(containerReqs.maxWeightKg);
      console.log('maxWeightKg:', maxWeight);
      console.log('targetAmount:', campaign.targetAmount);
      
      if (maxWeight > 0) {
        const pricePerKg = parseFloat(campaign.targetAmount) / maxWeight;
        const calculatedPayment = (parseFloat(weightKg) * pricePerKg).toFixed(2);
        console.log('Calculation:', {
          weightKg,
          maxWeight,
          targetAmount: campaign.targetAmount,
          pricePerKg,
          calculatedPayment
        });
        setPaymentAmount(calculatedPayment);
        console.log('Payment amount set to:', calculatedPayment);
      } else {
        console.log('maxWeight is 0 or invalid');
      }
    } else {
      console.log('Conditions NOT met:', {
        hasCampaign: !!campaign,
        isContainer: campaign?.campaignType === 1,
        hasContainerReqs: !!containerReqs,
        hasWeight: !!weightKg
      });
    }
  }, [weightKg, campaign, containerReqs]);

  const loadCampaign = async () => {
    setLoadingData(true);
    try {
      const data = await getCampaign(params.id);
      setCampaign(data);
      
      // If it's a container campaign, also fetch container requirements
      if (data && data.campaignType === 1) {
        const reqs = await getContainerRequirements(params.id);
        setContainerReqs(reqs);
      }
    } catch (error) {
      console.error('Error loading campaign:', error);
      setCampaign(null);
    } finally {
      setLoadingData(false);
    }
  };

  const handleJoinProduct = async (e) => {
    e.preventDefault();
    const result = await joinProductCampaign(params.id, quantity, shippingAddress, campaign.pricePerUnit);
    if (result.success) {
      alert('Successfully joined campaign!');
      await loadCampaign();
      setQuantity(1);
      setShippingAddress('');
    } else {
      alert(`Error: ${result.error}`);
    }
  };

  const handleJoinContainer = async (e) => {
    e.preventDefault();
    
    // Validate inputs
    if (!weightKg || parseFloat(weightKg) <= 0) {
      alert('Please enter a valid weight');
      return;
    }
    
    if (!paymentAmount || parseFloat(paymentAmount) <= 0) {
      alert('Payment amount not calculated. Please enter a weight first.');
      return;
    }
    
    const result = await joinContainerCampaign(
      params.id,
      paymentAmount,
      parseInt(weightKg),
      shippingAddress
    );
    if (result.success) {
      alert('Successfully joined campaign!');
      await loadCampaign();
      setPaymentAmount('');
      setWeightKg('');
      setShippingAddress('');
    } else {
      alert(`Error: ${result.error}`);
    }
  };

  const handleCancel = async () => {
    if (!confirm('Are you sure you want to cancel this campaign?')) return;
    
    const result = await cancelCampaign(params.id);
    if (result.success) {
      alert('Campaign cancelled successfully');
      await loadCampaign();
    } else {
      alert(`Error: ${result.error}`);
    }
  };

  if (loadingData) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-cyan-400 text-xl">Loading campaign...</div>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="text-center py-16">
        <div className="text-gray-400 text-xl">Campaign not found</div>
      </div>
    );
  }

  const status = CAMPAIGN_STATUS.find(s => s.value === Number(campaign.status)) || CAMPAIGN_STATUS[0];
  const isProduct = campaign.campaignType === 0;
  
  // Safe progress calculation - handle 0/0 case
  const currentAmount = parseFloat(campaign.currentAmount) || 0;
  const targetAmount = parseFloat(campaign.targetAmount) || 1; // Avoid division by zero
  const progress = (currentAmount / targetAmount) * 100;
  
  // Safe address comparison
  const isCreator = address && campaign.creator && 
                    typeof address === 'string' && 
                    typeof campaign.creator === 'string' &&
                    address.toLowerCase() === campaign.creator.toLowerCase();
  
  // Product campaigns (type 0) can accept joins even when fully funded since they're not container-constrained
  // Container campaigns (type 1) can only accept joins when active (status 0)
  const canJoin = isConnected && (
    isProduct 
      ? campaign.status === 0 || campaign.status === 1 // Product: Active or Funded
      : campaign.status === 0 // Container: Only Active
  );
  
  // Use proper Tailwind classes instead of dynamic ones
  const statusColors = {
    cyan: 'bg-cyan-500/20 text-cyan-400',
    green: 'bg-green-500/20 text-green-400',
    red: 'bg-red-500/20 text-red-400',
    purple: 'bg-purple-500/20 text-purple-400',
  };
  const statusClass = statusColors[status.color] || statusColors.cyan;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-4">
          <span className={`px-3 py-1 rounded-lg text-sm font-semibold ${statusClass}`}>
            {status.label}
          </span>
          <span className="px-3 py-1 bg-purple-500/20 text-purple-400 text-sm rounded-lg">
            {isProduct ? 'Product Campaign' : 'Container Campaign'}
          </span>
          {!isProduct && (
            <span className="px-3 py-1 bg-cyan-500/20 text-cyan-400 text-sm rounded-lg">
              {DIRECTION_TYPES[campaign.direction]?.label}
            </span>
          )}
        </div>
        <h1 className="text-4xl font-bold text-white mb-2">{campaign.name}</h1>
        <p className="text-gray-400">{campaign.description}</p>
      </div>

      {/* Main Info Card */}
      <div className="bg-gray-800 rounded-xl p-8 border border-gray-700">
        {/* Progress */}
        <div className="mb-6">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-400">Funding Progress</span>
            <span className="text-cyan-400 font-semibold">
              ${parseFloat(campaign.currentAmount).toLocaleString()} / ${parseFloat(campaign.targetAmount).toLocaleString()} USDC
            </span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-3">
            <div
              className="bg-gradient-to-r from-cyan-500 to-purple-600 h-3 rounded-full transition-all"
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
          <div className="text-right text-sm text-gray-400 mt-1">
            {progress.toFixed(1)}% funded
          </div>
        </div>

        {/* Details Grid */}
        <div className="grid md:grid-cols-2 gap-6">
          {isProduct ? (
            <>
              <DetailItem label="Price per Unit" value={`$${campaign.pricePerUnit} USDC`} />
              <DetailItem label="Unit" value={campaign.unit} />
              <DetailItem label="Min Quantity" value={campaign.minQuantity} />
              <DetailItem label="Current Quantity" value={campaign.currentQuantity} />
            </>
          ) : (
            <>
              <DetailItem label="Origin" value={campaign.originPort} />
              <DetailItem label="Destination" value={campaign.destinationPort} />
              <DetailItem label="Direction" value={DIRECTION_TYPES[campaign.direction]?.label} />
              {containerReqs && (
                <>
                  <DetailItem 
                    label="Container Capacity" 
                    value={`${containerReqs.currentWeightKg} / ${containerReqs.maxWeightKg} kg`} 
                  />
                  <DetailItem 
                    label="Price per kg" 
                    value={`$${(parseFloat(campaign.targetAmount) / parseFloat(containerReqs.maxWeightKg)).toFixed(2)} USDC`} 
                  />
                  <DetailItem 
                    label="Temperature Range" 
                    value={`${containerReqs.minTempCelsius}°C to ${containerReqs.maxTempCelsius}°C`} 
                  />
                  <DetailItem 
                    label="Container Type" 
                    value={['Standard 20ft', 'Standard 40ft', 'High Cube 40ft', 'High Cube 45ft', 'Refrigerated 20ft', 'Refrigerated 40ft'][containerReqs.containerType] || 'Unknown'} 
                  />
                </>
              )}
            </>
          )}
          <DetailItem label="Participants" value={campaign.participantCount} />
          <DetailItem label="Deadline" value={new Date(campaign.deadline).toLocaleString()} />
          <DetailItem label="Creator" value={`${campaign.creator?.slice(0, 6)}...${campaign.creator?.slice(-4)}`} />
          <DetailItem label="Campaign ID" value={campaign.id} />
        </div>
      </div>

      {/* Join Form */}
      {canJoin && (
        <div className="bg-gray-800 rounded-xl p-8 border border-cyan-500/50">
          <h2 className="text-2xl font-bold text-white mb-6">Join Campaign</h2>
          
          {/* Approval Status */}
          {!hasInfiniteApproval && (
            <div className="bg-yellow-500/10 border border-yellow-500/50 rounded-lg p-4 mb-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-yellow-400 font-semibold mb-1">⚡ One-Time Approval Required</h3>
                  <p className="text-sm text-gray-300">
                    Grant approval once to join campaigns without extra transactions. This is a one-time setup that saves gas on all future joins.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={async () => {
                    const result = await approveUSDC();
                    if (result.success && !result.alreadyApproved) {
                      alert('✅ Approval granted! You can now join campaigns with just one transaction.');
                    }
                  }}
                  disabled={loading}
                  className="ml-4 px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-black font-semibold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
                >
                  {loading ? 'Approving...' : 'Approve USDC'}
                </button>
              </div>
            </div>
          )}
          
          {hasInfiniteApproval && (
            <div className="bg-green-500/10 border border-green-500/50 rounded-lg p-3 mb-6">
              <p className="text-green-400 text-sm font-medium">✅ Approved - Ready to join with one transaction!</p>
            </div>
          )}
          
          {isProduct ? (
            <form onSubmit={handleJoinProduct} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Quantity ({campaign.unit}) *
                </label>
                <input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(parseInt(e.target.value))}
                  required
                  min="1"
                  className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:border-cyan-500 focus:outline-none"
                />
                <div className="text-sm text-gray-400 mt-1">
                  Cost: ${(quantity * parseFloat(campaign.pricePerUnit)).toFixed(2)} USDC
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Shipping Address *
                </label>
                <textarea
                  value={shippingAddress}
                  onChange={(e) => setShippingAddress(e.target.value)}
                  required
                  rows={3}
                  className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:border-cyan-500 focus:outline-none"
                  placeholder="Enter your shipping address..."
                />
              </div>
              
              <button
                type="submit"
                disabled={loading}
                className="w-full px-6 py-3 bg-gradient-to-r from-cyan-500 to-purple-600 text-white font-semibold rounded-lg hover:shadow-lg hover:shadow-cyan-500/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {loading ? 'Processing...' : 'Join Campaign'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleJoinContainer} className="space-y-4">
              {containerReqs && (
                <div className="bg-cyan-500/10 rounded-lg p-4 mb-4 border border-cyan-500/30">
                  <div className="text-sm text-cyan-300">
                    <div className="font-semibold mb-1">Container Pricing</div>
                    <div>Max Capacity: {containerReqs.maxWeightKg} kg</div>
                    <div>Price per kg: ${(parseFloat(campaign.targetAmount) / parseFloat(containerReqs.maxWeightKg)).toFixed(2)} USDC</div>
                  </div>
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Weight (kg) *
                </label>
                <input
                  type="number"
                  value={weightKg}
                  onChange={(e) => setWeightKg(e.target.value)}
                  required
                  min="1"
                  max={containerReqs?.maxWeightKg || undefined}
                  className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:border-cyan-500 focus:outline-none"
                  placeholder={containerReqs ? `Max: ${containerReqs.maxWeightKg} kg` : ''}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Payment Amount (USDC) - Auto-calculated
                </label>
                <input
                  type="text"
                  value={paymentAmount ? `$${paymentAmount}` : ''}
                  disabled
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-400 cursor-not-allowed"
                  placeholder="Enter weight to calculate payment"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Shipping Address *
                </label>
                <textarea
                  value={shippingAddress}
                  onChange={(e) => setShippingAddress(e.target.value)}
                  required
                  rows={3}
                  className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:border-cyan-500 focus:outline-none"
                  placeholder="Enter your shipping address..."
                />
              </div>
              
              <button
                type="submit"
                disabled={loading}
                className="w-full px-6 py-3 bg-gradient-to-r from-cyan-500 to-purple-600 text-white font-semibold rounded-lg hover:shadow-lg hover:shadow-cyan-500/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {loading ? 'Processing...' : 'Join Campaign'}
              </button>
            </form>
          )}
        </div>
      )}

      {/* Creator Actions */}
      {isCreator && campaign.status === 0 && (
        <div className="bg-gray-800 rounded-xl p-6 border border-red-500/50">
          <h3 className="text-lg font-semibold text-white mb-4">Creator Actions</h3>
          <button
            onClick={handleCancel}
            disabled={loading}
            className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg disabled:opacity-50 transition-all"
          >
            Cancel Campaign
          </button>
        </div>
      )}

      {/* Connect Prompt */}
      {!isConnected && (
        <div className="bg-cyan-500/10 rounded-xl p-6 border border-cyan-500/50 text-center">
          <p className="text-cyan-400 font-semibold">
            Connect your wallet to join this campaign
          </p>
        </div>
      )}
    </div>
  );
}

function DetailItem({ label, value }) {
  return (
    <div>
      <div className="text-sm text-gray-400 mb-1">{label}</div>
      <div className="text-white font-semibold">{value}</div>
    </div>
  );
}

'use client';

import Link from 'next/link';
import { CAMPAIGN_STATUS, DIRECTION_TYPES } from '@/lib/data/ports';

export default function CampaignCard({ campaign }) {
  const status = CAMPAIGN_STATUS.find(s => s.value === Number(campaign.status)) || CAMPAIGN_STATUS[0];
  const isProduct = campaign.campaignType === 0;
  const progress = (parseFloat(campaign.currentAmount) / parseFloat(campaign.targetAmount)) * 100;
  const daysLeft = Math.ceil((campaign.deadline - new Date()) / (1000 * 60 * 60 * 24));
  
  // Use proper Tailwind classes instead of dynamic ones
  const statusColors = {
    cyan: 'bg-cyan-500/20 text-cyan-400',
    green: 'bg-green-500/20 text-green-400',
    red: 'bg-red-500/20 text-red-400',
    purple: 'bg-purple-500/20 text-purple-400',
  };
  const statusClass = statusColors[status.color] || statusColors.cyan;

  return (
    <Link href={`/campaigns/${campaign.id}`}>
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 hover:border-cyan-500 hover:shadow-lg hover:shadow-cyan-500/20 transition-all cursor-pointer">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="text-xl font-bold text-white mb-1">{campaign.name}</h3>
            <p className="text-sm text-gray-400 line-clamp-2">{campaign.description}</p>
          </div>
          <span className={`px-3 py-1 rounded-lg text-xs font-semibold ${statusClass}`}>
            {status.label}
          </span>
        </div>

        {/* Campaign Type Badge */}
        <div className="mb-4">
          <span className="px-2 py-1 bg-purple-500/20 text-purple-400 text-xs rounded">
            {isProduct ? 'Product Campaign' : 'Container Campaign'}
          </span>
          {!isProduct && (
            <span className="ml-2 px-2 py-1 bg-cyan-500/20 text-cyan-400 text-xs rounded">
              {DIRECTION_TYPES[campaign.direction]?.label}
            </span>
          )}
        </div>

        {/* Details */}
        <div className="space-y-3 mb-4">
          {isProduct ? (
            <>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Price per Unit</span>
                <span className="text-white font-semibold">${campaign.pricePerUnit} USDC</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Quantity</span>
                <span className="text-white">
                  {campaign.currentQuantity} / {campaign.minQuantity} {campaign.unit}
                </span>
              </div>
            </>
          ) : (
            <>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Route</span>
                <span className="text-white text-right">{campaign.originPort} → {campaign.destinationPort}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Weight</span>
                <span className="text-white">{campaign.currentWeightKg || 0} kg</span>
              </div>
            </>
          )}
        </div>

        {/* Progress Bar */}
        <div className="mb-4">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-400">Funding Progress</span>
            <span className="text-cyan-400 font-semibold">
              ${parseFloat(campaign.currentAmount).toLocaleString()} / ${parseFloat(campaign.targetAmount).toLocaleString()}
            </span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-cyan-500 to-purple-600 h-2 rounded-full transition-all"
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between text-sm">
          <div className="text-gray-400">
            <span className="text-white font-semibold">{campaign.participantCount}</span> participants
          </div>
          <div className={daysLeft > 0 ? 'text-gray-400' : 'text-red-400'}>
            {daysLeft > 0 ? `${daysLeft} days left` : 'Expired'}
          </div>
        </div>
      </div>
    </Link>
  );
}

'use client';

import { useState } from 'react';
import { useWeb3Auth } from '@/lib/Web3AuthContext';
import { useRouter } from 'next/navigation';
import CreateProductForm from '@/components/campaigns/CreateProductForm';
import CreateContainerForm from '@/components/campaigns/CreateContainerForm';

export default function CreateCampaignPage() {
  const { isConnected } = useWeb3Auth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('product'); // product or container

  if (!isConnected) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-gray-800 rounded-xl p-12 border border-gray-700 text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Wallet Not Connected</h2>
          <p className="text-gray-400 mb-6">
            Please connect your wallet to create a campaign
          </p>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-3 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg transition-all"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold text-white mb-2">Create Campaign</h1>
        <p className="text-gray-400">
          Choose between a product campaign or container consolidation campaign
        </p>
      </div>

      {/* Tabs */}
      <div className="bg-gray-800 rounded-xl border border-gray-700">
        <div className="flex border-b border-gray-700">
          <button
            onClick={() => setActiveTab('product')}
            className={`flex-1 px-6 py-4 font-semibold transition-all ${
              activeTab === 'product'
                ? 'text-cyan-400 border-b-2 border-cyan-500'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Product Campaign
          </button>
          <button
            onClick={() => setActiveTab('container')}
            className={`flex-1 px-6 py-4 font-semibold transition-all ${
              activeTab === 'container'
                ? 'text-cyan-400 border-b-2 border-cyan-500'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Container Campaign
          </button>
        </div>

        <div className="p-8">
          {/* Tab Description */}
          <div className="mb-8 p-4 bg-gray-900 rounded-lg border border-gray-700">
            {activeTab === 'product' ? (
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">Product Campaign</h3>
                <p className="text-gray-400 text-sm">
                  Create a group purchasing campaign for a specific product. Set the minimum quantity,
                  price per unit, and target amount. Participants can join by specifying their quantity
                  and shipping address.
                </p>
              </div>
            ) : (
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">Container Campaign</h3>
                <p className="text-gray-400 text-sm">
                  Create a container consolidation campaign for shared shipping. Specify container
                  requirements, route, and target amount. Participants can join by contributing payment
                  and cargo weight.
                </p>
              </div>
            )}
          </div>

          {/* Forms */}
          {activeTab === 'product' ? <CreateProductForm /> : <CreateContainerForm />}
        </div>
      </div>
    </div>
  );
}

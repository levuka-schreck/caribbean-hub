'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useCampaigns } from '@/lib/hooks/useCampaigns';

export default function CreateProductForm() {
  const router = useRouter();
  const { createProductCampaign, loading } = useCampaigns();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    minQuantity: '',
    pricePerUnit: '',
    unit: '',
    deadline: '',
  });

  // Auto-calculate target amount
  const targetAmount = useMemo(() => {
    const qty = parseFloat(formData.minQuantity) || 0;
    const price = parseFloat(formData.pricePerUnit) || 0;
    return (qty * price).toFixed(2);
  }, [formData.minQuantity, formData.pricePerUnit]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate target amount is greater than 0
    if (parseFloat(targetAmount) <= 0) {
      alert('Please enter valid quantity and price values');
      return;
    }
    
    // Pass clean values - no extra conversions
    const submissionData = {
      name: formData.name.trim(),
      description: formData.description.trim(),
      minQuantity: formData.minQuantity, // Keep as is
      pricePerUnit: formData.pricePerUnit, // Keep as is
      unit: formData.unit.trim(),
      targetAmount: targetAmount, // Already calculated
      deadline: formData.deadline,
    };
    
    console.log('Submitting product campaign:', submissionData);
    
    const result = await createProductCampaign(submissionData);
    
    if (result.success) {
      router.push(`/campaigns/${result.campaignId}`);
    } else {
      console.error('Campaign creation failed:', result.error);
      alert(`Error: ${result.error}`);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid md:grid-cols-2 gap-6">
        {/* Campaign Name */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Campaign Name *
          </label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:border-cyan-500 focus:outline-none"
            placeholder="e.g., Bulk Rice Purchase"
          />
        </div>

        {/* Description */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Description *
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            required
            rows={4}
            className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:border-cyan-500 focus:outline-none"
            placeholder="Describe the product and campaign details..."
          />
        </div>

        {/* Minimum Quantity */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Minimum Quantity *
          </label>
          <input
            type="number"
            name="minQuantity"
            value={formData.minQuantity}
            onChange={handleChange}
            required
            min="1"
            className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:border-cyan-500 focus:outline-none"
            placeholder="100"
          />
        </div>

        {/* Unit */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Unit *
          </label>
          <input
            type="text"
            name="unit"
            value={formData.unit}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:border-cyan-500 focus:outline-none"
            placeholder="e.g., kg, lbs, units"
          />
        </div>

        {/* Price per Unit */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Price per Unit (USDC) *
          </label>
          <input
            type="number"
            name="pricePerUnit"
            value={formData.pricePerUnit}
            onChange={handleChange}
            required
            min="0"
            step="0.01"
            className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:border-cyan-500 focus:outline-none"
            placeholder="5.50"
          />
        </div>

        {/* Target Amount (Auto-calculated) */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Target Amount (USDC) - Auto-calculated
          </label>
          <div className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-cyan-400 font-semibold">
            ${targetAmount}
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Calculated: {formData.minQuantity || 0} × ${formData.pricePerUnit || 0}
          </p>
        </div>

        {/* Deadline */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Campaign Deadline *
          </label>
          <input
            type="datetime-local"
            name="deadline"
            value={formData.deadline}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:border-cyan-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={loading}
        className="w-full px-6 py-3 bg-gradient-to-r from-cyan-500 to-purple-600 text-white font-semibold rounded-lg hover:shadow-lg hover:shadow-cyan-500/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
      >
        {loading ? 'Creating Campaign...' : 'Create Product Campaign'}
      </button>
    </form>
  );
}

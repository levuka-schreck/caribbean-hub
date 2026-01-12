'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCampaigns } from '@/lib/hooks/useCampaigns';
import { PORTS, CONTAINER_TYPES, REFRIGERATION_TYPES, DIRECTION_TYPES } from '@/lib/data/ports';

export default function CreateContainerForm() {
  const router = useRouter();
  const { createContainerCampaign, loading } = useCampaigns();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    direction: 0,
    originPort: '',
    destinationPort: '',
    containerType: 'STANDARD_40',
    temperatureControlled: false,
    minTemperature: 0,
    maxTemperature: 0,
    maxWeightKg: '',
    ventilationRequired: false,
    refrigerationType: 0,
    targetAmount: '',
    deadline: '',
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Pass clean values - minimal conversion
    const submissionData = {
      name: formData.name.trim(),
      description: formData.description.trim(),
      direction: formData.direction, // Keep as string, will be parsed in hook
      originPort: formData.originPort.trim(),
      destinationPort: formData.destinationPort.trim(),
      containerType: formData.containerType,
      temperatureControlled: formData.temperatureControlled,
      minTemperature: formData.minTemperature,
      maxTemperature: formData.maxTemperature,
      maxWeightKg: formData.maxWeightKg, // Keep as string
      ventilationRequired: formData.ventilationRequired,
      refrigerationType: formData.refrigerationType,
      targetAmount: formData.targetAmount, // Keep as string
      deadline: formData.deadline,
    };
    
    console.log('Submitting container campaign:', submissionData);
    
    const result = await createContainerCampaign(submissionData);
    
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
            placeholder="e.g., Miami to Kingston Consolidated Cargo"
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
            placeholder="Describe the container campaign..."
          />
        </div>

        {/* Direction */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Direction *
          </label>
          <select
            name="direction"
            value={formData.direction}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:border-cyan-500 focus:outline-none"
          >
            {DIRECTION_TYPES.map(dir => (
              <option key={dir.value} value={dir.value}>{dir.label}</option>
            ))}
          </select>
        </div>

        {/* Container Type */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Container Type *
          </label>
          <select
            name="containerType"
            value={formData.containerType}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:border-cyan-500 focus:outline-none"
          >
            {CONTAINER_TYPES.map(type => (
              <option key={type.value} value={type.value}>{type.label}</option>
            ))}
          </select>
        </div>

        {/* Origin Port */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Origin Port *
          </label>
          <select
            name="originPort"
            value={formData.originPort}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:border-cyan-500 focus:outline-none"
          >
            <option value="">Select Port</option>
            {PORTS.map(port => (
              <option key={port.code} value={port.name}>
                {port.name}, {port.country}
              </option>
            ))}
          </select>
        </div>

        {/* Destination Port */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Destination Port *
          </label>
          <select
            name="destinationPort"
            value={formData.destinationPort}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:border-cyan-500 focus:outline-none"
          >
            <option value="">Select Port</option>
            {PORTS.map(port => (
              <option key={port.code} value={port.name}>
                {port.name}, {port.country}
              </option>
            ))}
          </select>
        </div>

        {/* Max Weight */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Max Weight (kg) *
          </label>
          <input
            type="number"
            name="maxWeightKg"
            value={formData.maxWeightKg}
            onChange={handleChange}
            required
            min="1"
            className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:border-cyan-500 focus:outline-none"
            placeholder="25000"
          />
        </div>

        {/* Refrigeration Type */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Refrigeration *
          </label>
          <select
            name="refrigerationType"
            value={formData.refrigerationType}
            onChange={handleChange}
            className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:border-cyan-500 focus:outline-none"
          >
            {REFRIGERATION_TYPES.map(type => (
              <option key={type.value} value={type.value}>{type.label}</option>
            ))}
          </select>
        </div>

        {/* Temperature Controlled Checkbox */}
        <div className="md:col-span-2 flex items-center space-x-2">
          <input
            type="checkbox"
            name="temperatureControlled"
            checked={formData.temperatureControlled}
            onChange={handleChange}
            className="w-4 h-4 text-cyan-500 bg-gray-900 border-gray-700 rounded focus:ring-cyan-500"
          />
          <label className="text-sm text-gray-300">
            Temperature Controlled
          </label>
        </div>

        {/* Temperature Range (if controlled) */}
        {formData.temperatureControlled && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Min Temperature (°C)
              </label>
              <input
                type="number"
                name="minTemperature"
                value={formData.minTemperature}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:border-cyan-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Max Temperature (°C)
              </label>
              <input
                type="number"
                name="maxTemperature"
                value={formData.maxTemperature}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:border-cyan-500 focus:outline-none"
              />
            </div>
          </>
        )}

        {/* Ventilation Required */}
        <div className="md:col-span-2 flex items-center space-x-2">
          <input
            type="checkbox"
            name="ventilationRequired"
            checked={formData.ventilationRequired}
            onChange={handleChange}
            className="w-4 h-4 text-cyan-500 bg-gray-900 border-gray-700 rounded focus:ring-cyan-500"
          />
          <label className="text-sm text-gray-300">
            Ventilation Required
          </label>
        </div>

        {/* Target Amount */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Target Amount (USDC) *
          </label>
          <input
            type="number"
            name="targetAmount"
            value={formData.targetAmount}
            onChange={handleChange}
            required
            min="0"
            step="0.01"
            className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:border-cyan-500 focus:outline-none"
            placeholder="15000"
          />
        </div>

        {/* Deadline */}
        <div>
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
        {loading ? 'Creating Campaign...' : 'Create Container Campaign'}
      </button>
    </form>
  );
}

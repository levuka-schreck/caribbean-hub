'use client';

import { useState } from 'react';
import { useRoutes } from '@/lib/hooks/useRoutes';
import { PORTS, REFRIGERATION_TYPES } from '@/lib/data/ports';

export default function CreateRouteForm({ onSuccess }) {
  const { createRoute, loading } = useRoutes();
  const [formData, setFormData] = useState({
    shipId: '',
    shipName: '',
    description: '',
    departurePort: '',
    capacity: '',
    refrigerationType: 0,
  });
  const [ports, setPorts] = useState([{ name: '', code: '', country: '', arrivalTime: '' }]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePortChange = (index, field, value) => {
    const newPorts = [...ports];
    newPorts[index][field] = value;
    
    // Auto-fill port code and country when name is selected
    if (field === 'name') {
      const selectedPort = PORTS.find(p => p.name === value);
      if (selectedPort) {
        newPorts[index].code = selectedPort.code;
        newPorts[index].country = selectedPort.country;
      }
    }
    
    setPorts(newPorts);
  };

  const addPort = () => {
    setPorts([...ports, { name: '', code: '', country: '', arrivalTime: '' }]);
  };

  const removePort = (index) => {
    if (ports.length > 1) {
      setPorts(ports.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const routeData = {
      ...formData,
      capacity: parseInt(formData.capacity),
      refrigerationType: parseInt(formData.refrigerationType),
      ports,
    };
    
    const result = await createRoute(routeData);
    
    if (result.success) {
      alert('Route created successfully!');
      if (onSuccess) onSuccess();
      // Reset form
      setFormData({
        shipId: '',
        shipName: '',
        description: '',
        departurePort: '',
        capacity: '',
        refrigerationType: 0,
      });
      setPorts([{ name: '', code: '', country: '', arrivalTime: '' }]);
    } else {
      alert(`Error: ${result.error}`);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid md:grid-cols-2 gap-6">
        {/* Ship ID */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Ship ID *
          </label>
          <input
            type="text"
            name="shipId"
            value={formData.shipId}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:border-cyan-500 focus:outline-none"
            placeholder="SHIP-001"
          />
        </div>

        {/* Ship Name */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Ship Name *
          </label>
          <input
            type="text"
            name="shipName"
            value={formData.shipName}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:border-cyan-500 focus:outline-none"
            placeholder="Caribbean Express"
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
            rows={3}
            className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:border-cyan-500 focus:outline-none"
            placeholder="Route description..."
          />
        </div>

        {/* Departure Port */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Departure Port *
          </label>
          <select
            name="departurePort"
            value={formData.departurePort}
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

        {/* Capacity */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Capacity (TEU) *
          </label>
          <input
            type="number"
            name="capacity"
            value={formData.capacity}
            onChange={handleChange}
            required
            min="1"
            className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:border-cyan-500 focus:outline-none"
            placeholder="100"
          />
        </div>

        {/* Refrigeration Type */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Refrigeration Type *
          </label>
          <select
            name="refrigerationType"
            value={formData.refrigerationType}
            onChange={handleChange}
            className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:border-cyan-500 focus:outline-none"
          >
            {REFRIGERATION_TYPES.map(type => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Destination Ports */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <label className="text-sm font-medium text-gray-300">
            Destination Ports * (At least 1)
          </label>
          <button
            type="button"
            onClick={addPort}
            className="px-3 py-1 bg-cyan-600 hover:bg-cyan-700 text-white text-sm rounded-lg transition-all"
          >
            + Add Port
          </button>
        </div>

        <div className="space-y-4">
          {ports.map((port, index) => (
            <div key={index} className="bg-gray-900 rounded-lg p-4 border border-gray-700">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">
                    Port Name *
                  </label>
                  <select
                    value={port.name}
                    onChange={(e) => handlePortChange(index, 'name', e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white text-sm focus:border-cyan-500 focus:outline-none"
                  >
                    <option value="">Select Port</option>
                    {PORTS.map(p => (
                      <option key={p.code} value={p.name}>
                        {p.name}, {p.country}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-gray-400 mb-1">
                    Arrival Time *
                  </label>
                  <input
                    type="datetime-local"
                    value={port.arrivalTime}
                    onChange={(e) => handlePortChange(index, 'arrivalTime', e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white text-sm focus:border-cyan-500 focus:outline-none"
                  />
                </div>
              </div>

              {ports.length > 1 && (
                <button
                  type="button"
                  onClick={() => removePort(index)}
                  className="mt-2 text-xs text-red-400 hover:text-red-300"
                >
                  Remove Port
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={loading}
        className="w-full px-6 py-3 bg-gradient-to-r from-cyan-500 to-purple-600 text-white font-semibold rounded-lg hover:shadow-lg hover:shadow-cyan-500/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
      >
        {loading ? 'Creating Route...' : 'Create Shipping Route'}
      </button>
    </form>
  );
}

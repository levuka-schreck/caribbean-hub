// Caribbean and US Ports
export const PORTS = [
  // Caribbean Ports
  { name: 'Kingston', code: 'KIN', country: 'Jamaica', region: 'Caribbean' },
  { name: 'Montego Bay', code: 'MBJ', country: 'Jamaica', region: 'Caribbean' },
  { name: 'Port-au-Prince', code: 'PAP', country: 'Haiti', region: 'Caribbean' },
  { name: 'Santo Domingo', code: 'SDQ', country: 'Dominican Republic', region: 'Caribbean' },
  { name: 'San Juan', code: 'SJU', country: 'Puerto Rico', region: 'Caribbean' },
  { name: 'Bridgetown', code: 'BGI', country: 'Barbados', region: 'Caribbean' },
  { name: 'Port of Spain', code: 'POS', country: 'Trinidad and Tobago', region: 'Caribbean' },
  { name: 'Castries', code: 'SLU', country: 'Saint Lucia', region: 'Caribbean' },
  { name: 'Pointe-à-Pitre', code: 'PTP', country: 'Guadeloupe', region: 'Caribbean' },
  { name: 'Willemstad', code: 'CUR', country: 'Curaçao', region: 'Caribbean' },
  { name: 'Nassau', code: 'NAS', country: 'Bahamas', region: 'Caribbean' },
  { name: 'George Town', code: 'GCM', country: 'Cayman Islands', region: 'Caribbean' },
  { name: 'Oranjestad', code: 'AUA', country: 'Aruba', region: 'Caribbean' },
  { name: 'Philipsburg', code: 'SXM', country: 'Sint Maarten', region: 'Caribbean' },
  { name: 'Road Town', code: 'TOV', country: 'British Virgin Islands', region: 'Caribbean' },
  
  // US Ports
  { name: 'Miami', code: 'MIA', country: 'United States', region: 'US' },
  { name: 'Fort Lauderdale', code: 'FLL', country: 'United States', region: 'US' },
  { name: 'Tampa', code: 'TPA', country: 'United States', region: 'US' },
  { name: 'Jacksonville', code: 'JAX', country: 'United States', region: 'US' },
  { name: 'New Orleans', code: 'MSY', country: 'United States', region: 'US' },
  { name: 'Houston', code: 'HOU', country: 'United States', region: 'US' },
  { name: 'Charleston', code: 'CHS', country: 'United States', region: 'US' },
  { name: 'Savannah', code: 'SAV', country: 'United States', region: 'US' },
  { name: 'Mobile', code: 'MOB', country: 'United States', region: 'US' },
  { name: 'Port Canaveral', code: 'COF', country: 'United States', region: 'US' },
];

// Container types
export const CONTAINER_TYPES = [
  { value: 'STANDARD_20', label: "20' Standard", enumValue: 0 },
  { value: 'STANDARD_40', label: "40' Standard", enumValue: 1 },
  { value: 'HIGH_CUBE_40', label: "40' High Cube", enumValue: 2 },
  { value: 'HIGH_CUBE_45', label: "45' High Cube", enumValue: 3 },
  { value: 'REFRIGERATED_20', label: "20' Refrigerated", enumValue: 4 },
  { value: 'REFRIGERATED_40', label: "40' Refrigerated", enumValue: 5 },
];

// Helper function to get container enum value
export const getContainerTypeEnum = (containerType) => {
  const type = CONTAINER_TYPES.find(t => t.value === containerType);
  return type ? type.enumValue : 0;
};

// Refrigeration types
export const REFRIGERATION_TYPES = [
  { value: 0, label: 'None' },
  { value: 1, label: 'Standard' },
  { value: 2, label: 'Deep Freeze' },
  { value: 3, label: 'Climate Controlled' },
];

// Direction types
export const DIRECTION_TYPES = [
  { value: 0, label: 'Inbound' },
  { value: 1, label: 'Outbound' },
];

// Campaign status
export const CAMPAIGN_STATUS = [
  { value: 0, label: 'Active', color: 'cyan' },
  { value: 1, label: 'Funded', color: 'green' },
  { value: 2, label: 'Cancelled', color: 'red' },
  { value: 3, label: 'Completed', color: 'purple' },
];

// Route status
export const ROUTE_STATUS = [
  { value: 0, label: 'Scheduled', color: 'blue' },
  { value: 1, label: 'In Transit', color: 'cyan' },
  { value: 2, label: 'Completed', color: 'green' },
];

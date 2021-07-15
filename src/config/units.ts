export interface UnitConfig {
  stormUnits: string[];
  rescueUnits: string[];
  dutyOfficers?: boolean;
  capabilities: {
    verticalRescue?: boolean;
    floodRescue?: boolean;
  };
  flexibleAndSupportTeams?: string[];
}

export const UNIT_CONFIGS: { [code: string]: UnitConfig } = {
  'WOL': {
    stormUnits: ['WOL'],
    rescueUnits: ['WOL', 'DPT'],
    dutyOfficers: true,
    capabilities: {
      verticalRescue: true,
      floodRescue: true,
    },
    flexibleAndSupportTeams: [
      'Foxtrot', 'Quebec', 'Catering', 'Logistics', 'Training', 'India', 'Planning'
    ],
  },
  'DPT': {
    stormUnits: ['DPT'],
    rescueUnits: ['WOL', 'DPT'],
    capabilities: {
      verticalRescue: true,
      floodRescue: true,
    },
  },
  'OSU': {
    stormUnits: ['OSU'],
    rescueUnits: [],
    dutyOfficers: true,
    capabilities: { },
  },
};

export function anyRescueCapabilities(unit: UnitConfig) {
  return unit.capabilities.verticalRescue || unit.capabilities.floodRescue;
}

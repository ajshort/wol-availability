export interface UnitConfig {
  stormUnits: string[];
  rescueUnits: string[];
  capabilities: {
    verticalRescue?: boolean;
    floodRescue?: boolean;
  }
}

export const UNIT_CONFIGS: { [code: string]: UnitConfig } = {
  'WOL': {
    stormUnits: ['WOL'],
    rescueUnits: ['WOL', 'DPT'],
    capabilities: {
      verticalRescue: true,
      floodRescue: true,
    },
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
    capabilities: { },
  },
};

export function anyRescueCapabilities(unit: UnitConfig) {
  return unit.capabilities.verticalRescue || unit.capabilities.floodRescue;
}

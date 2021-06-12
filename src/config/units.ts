export interface UnitConfig {
  stormUnits: string[];
  rescueUnits: string[];
  capabilities: {
    verticalRescue?: boolean;
    floodRescue?: boolean;
  }
}

export const UNIT_CONFIGS: { [code: string]: UnitConfig } = {
  'SEZ-NIC-WOL': {
    stormUnits: ['SEZ-NIC-WOL'],
    rescueUnits: ['SEZ-NIC-WOL', 'SEZ-NIC-DPT'],
    capabilities: {
      verticalRescue: true,
      floodRescue: true,
    },
  },
};

export function anyRescueCapabilities(unit: UnitConfig) {
  return unit.capabilities.verticalRescue || unit.capabilities.floodRescue;
}

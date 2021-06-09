export interface UnitConfig {
  stormUnits: string[];
  rescueUnits: string[];
}

export const UNIT_CONFIGS: { [code: string]: UnitConfig } = {
  'SEZ-NIC-WOL': {
    stormUnits: ['SEZ-NIC-WOL'],
    rescueUnits: ['SEZ-NIC-WOL', 'SEZ-NIC-DPT'],
  },
};

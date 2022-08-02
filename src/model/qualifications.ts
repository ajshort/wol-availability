export const QUALIFICATIONS: { [code: string]: { name: string; abbreviation: string; } } = {
  'BEA-ACC': { name: 'Beacon', abbreviation: 'BEA' },
  'BOAT-ACC': { name: 'Boat operator', abbreviation: 'BOAT' },
  'CFR-ACC': { name: 'Community First Response (CFR)', abbreviation: 'CFR' },
  'CL1-ACC': { name: 'Chainsaw cross-cut', abbreviation: 'CS' },
  'CL2-ACC': { name: 'Chainsaw felling', abbreviation: 'CSF' },
  'DRL1-ACC': { name: 'Driver level 1', abbreviation: 'DRL1' },
  'DRL2-ACC': { name: 'Driver level 2', abbreviation: 'DRL2' },
  'DRL3-ACC': { name: 'Driver level 3', abbreviation: 'DRL3' },
  'FRL1-ACC': { name: 'Land-based (L1) flood rescue', abbreviation: 'LB' },
  'FRL2-ACC': { name: 'On-water (L2) flood rescue', abbreviation: 'OW' },
  'FRL3-ACC': { name: 'In-water (L3) flood rescue', abbreviation: 'IW' },
  'GR2-ACC': { name: 'General Land Rescue (GLR)', abbreviation: 'GLR' },
  'SAR1-ACC': { name: 'Land search level 2', abbreviation: 'LS' },
  'SAR2-ACC': { name: 'Land search level 2', abbreviation: 'LS2' },
  'SWDG-ACC': { name: 'Storm and water damage (ground)', abbreviation: 'SWDG' },
  'SWDH-ACC': { name: 'Storm and water damage (heights)', abbreviation: 'SWD' },
  'USAR1-ACC': { name: 'Urban Search and Rescue (USAR)', abbreviation: 'USAR' },
  'VR-ACC': { name: 'Vertical Rescue (VR)', abbreviation: 'VR' },
};

export const VERTICAL_RESCUE = 'VR-ACC';

export const FLOOD_RESCUE_L1 = 'FRL1-ACC';
export const FLOOD_RESCUE_L2 = 'FRL2-ACC';
export const FLOOD_RESCUE_L3 = 'FRL3-ACC';

export const FLOOD_RESCUE = [
  FLOOD_RESCUE_L1,
  FLOOD_RESCUE_L2,
  FLOOD_RESCUE_L3,
];

export const PAD = 'PAD Operator';

export const FEATURED = [
  'SWDG-ACC',
  'SWDH-ACC',
  'CL1-ACC',
  'SAR1-ACC',
  'FRL1-ACC',
  'FRL2-ACC',
  'FRL3-ACC',
  'VR-ACC',
  'IMT Member',
  'Incident Controller',
  'Key holder',
];

export const SUPPRESSED_BY: { [key: string]: string } = {
  [FLOOD_RESCUE_L1]: FLOOD_RESCUE_L3,
  ['SWDG-ACC']: 'SWDH-ACC',
};

export function compareFloodRescue(qualificationsA: string[], qualificationsB: string[]) {
  const level = (qualifications: string[]) => {
    if (qualifications.includes(FLOOD_RESCUE_L3)) {
      return 3;
    } else if (qualifications.includes(FLOOD_RESCUE_L2)) {
      return 2;
    } else {
      return 1;
    }
  };

  return level(qualificationsB) - level(qualificationsA);
}

export function getDriverAuthLevel(qualifications: string[]) {
  if (qualifications.includes('DRL3-ACC')) {
    return 3;
  }
  if (qualifications.includes('DRL2-ACC')) {
    return 2;
  }
  if (qualifications.includes('DRL1-ACC')) {
    return 1;
  }
  return 0;
}

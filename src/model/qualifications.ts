export const VERTICAL_RESCUE = 'VR-ACC';

export const FLOOD_RESCUE_L1 = 'FRL1-ACC';
export const FLOOD_RESCUE_L2 = 'FRL2-ACC';
export const FLOOD_RESCUE_L3 = 'FRL3-ACC';

export const FLOOD_RESCUE = [
  FLOOD_RESCUE_L1,
  FLOOD_RESCUE_L2,
  FLOOD_RESCUE_L3,
];

export const FEATURED = [
  'SWDG-ACC',
  'CL1-ACC',
  ...FLOOD_RESCUE,
  VERTICAL_RESCUE,
];

export const MANUAL_DRIVER = 'Manual Driver';

export const SUPPRESSED_BY: { [key: string]: string } = {
  [FLOOD_RESCUE_L1]: FLOOD_RESCUE_L3,
};

export const ABBREVIATIONS: { [key: string]: string } = {
  'CL1-ACC': 'CS',
  'FRL2-ACC': 'OW',
  'SWDG-ACC': 'SWD',
  'FRL1-ACC': 'LB',
  'FRL3-ACC': 'IW',
  'VR-ACC': 'VR',
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

export const VERTICAL_RESCUE = 'Vertical Rescue (PUASAR004B/PUASAR032A)';

export const FLOOD_RESCUE_L1 = 'Swiftwater Rescue Awareness (FR L1)';
export const FLOOD_RESCUE_L2 = 'Flood Rescue Boat Operator (FR L2)';
export const FLOOD_RESCUE_L3 = 'Swiftwater Rescue Technician (FR L3)';

export const FLOOD_RESCUE = [
  FLOOD_RESCUE_L1,
  FLOOD_RESCUE_L2,
  FLOOD_RESCUE_L3,
];

export const PAD = 'PAD Operator';

export const FEATURED = [
  'Storm and Water Damage Operation',
  'Land Search Team Member',
  'Chainsaw Operator (Cross-Cut & Limb)',
  'Chainsaw Operator (Tree Felling)',
  'Swiftwater Rescue Awareness (FR L1)',
  'Flood Rescue Boat Operator (FR L2)',
  'Swiftwater Rescue Technician (FR L3)',
  'Vertical Rescue (PUASAR004B/PUASAR032A)',
  'IMT Member',
  'Incident Controller',
  'Key holder',
];

export const MANUAL_DRIVER = 'Manual Driver';

export const SUPPRESSED_BY: { [key: string]: string } = {
  'Chainsaw Operator (Cross-Cut & Limb)': 'Chainsaw Operator (Tree Felling)',
  'Swiftwater Rescue Awareness (FR L1)': 'Swiftwater Rescue Technician (FR L3)',
};

export const ABBREVIATIONS: { [key: string]: string } = {
  'Chainsaw Operator (Cross-Cut & Limb)': 'CS',
  'Chainsaw Operator (Tree Felling)': 'CS2',
  'Flood Rescue Boat Operator (FR L2)': 'OW',
  'IMT Member': 'IMT',
  'Incident Controller': 'IC',
  'Key holder': '🔑',
  'Land Search Team Member': 'LS',
  'Storm and Water Damage Operation': 'SWD',
  'Swiftwater Rescue Awareness (FR L1)': 'LB',
  'Swiftwater Rescue Technician (FR L3)': 'IW',
  'Vertical Rescue (PUASAR004B/PUASAR032A)': 'VR',
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

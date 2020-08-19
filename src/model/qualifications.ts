export const ALL = [
  'AIIMS 4 (Full)',
  'Air Observer',
  'Assessor - TAE',
  'Assessor',
  'Automatic External Defibrillator',
  'Aviation Radio Operator',
  'Beacon Familiarisation',
  'Beacon User',
  'Bush Fire Awareness',
  'Cadet Program',
  'Cadet Trainer Endorsement Workshop',
  'Certificate II in Public Safety (SES Ops)',
  'Certificate II in Public Safety (SES Rescue)',
  'Certificate II in Public Safety (SES)',
  'Certificate III in Public Safety (SES Rescue)',
  'Certificate IV in Training and Assessment',
  'Chainsaw Operator (Cross-Cut & Limb)',
  'Chainsaw Operator (Tree Felling)',
  'Communications Equipment Operator',
  'Community Engagement',
  'Community Liaison Officer',
  'Conduct Briefing and Debriefing',
  'Cordless Nailing Gun',
  'Crash Free Driver',
  'Crew small powercraft in a rescue operation (PUASAR015A)',
  'Drive Operational Vehicles',
  'Duty Officer Training',
  'Emergency Management Arrangements',
  'Emergency Management Overview',
  'Emergency Operations Centre Management',
  'Emergency Response Management',
  'Emergency Services Mine Induction ',
  'Evacuation Management',
  'Evidence Gatherer',
  'EWP Ticket',
  'Exercise Management',
  'Field Team Leader',
  'First Aid - Non-SES',
  'First Aid - SES',
  'Fit for Task (Flood Rescue)',
  'Flood Rescue - Fit for Task',
  'Flood Rescue Awareness',
  'Flood Rescue Boat Operator (FR L2)',
  'Four Wheel Drive Operator',
  'General Rescue',
  'GR Training Area Induction',
  'HSS Familiarisation',
  'IMT Member',
  'Incident Controller Level 1',
  'Incident Controller Level 2',
  'Incident Controller',
  'Induction / NSW SES Fundamentals',
  'Intro to Community Engagement (Module 1)',
  'Intro to Safe Driving',
  'Introduction to AIIMS-4 (eLearning)',
  'Introduction to AIIMS',
  'Introduction to DOV',
  'Introduction to Emergency Management',
  'Key holder',
  'Land Search Team Member',
  'Large Animal Rescue',
  'Leading Self Leading Others',
  'Liaise with Local Media',
  'Looking After People',
  'Maintain safety at an incident scene',
  'Maintain Team Safety',
  'Managing an Emergency Operation',
  'Map Reading',
  'Moderate Pack Test',
  'Navigate Urban Rural Environments',
  'Participate in a Rescue Operation',
  'Plan & Conduct Public Awareness Program',
  'Planning Engagement (Module 2)',
  'Planning Officer Level 2',
  'Reconnaissance',
  'Rescue From Vehicles in Water',
  'RFA Online Advanced User',
  'RFA Online Basic User',
  'RIIWHS202D Enter and Work in Confined Spaces',
  'SES Online',
  'Skills Trainer and Evidence Gatherer (STEG)',
  'Skills Trainer',
  'Storm and Water Damage Operation',
  'Swiftwater Rescue Awareness (FR L1)',
  'Swiftwater Rescue Technician (FR L3)',
  'Swim Test - 100m',
  'Swim Test - 200m',
  'Swim Test',
  'Team Leader',
  'Traffic Controller for Emergency Services',
  'Traffic Safety',
  'Trainer - TAE',
  'Trainer',
  'Trauma Care Workshop',
  'Tsunami Warning Officer',
  'USAR Category 1',
  'Vertical Rescue (PUASAR004B/PUASAR032A)',
  'Vertical Rescue Operator',
  'Waterways Authority License Test',
  'Work in an Emergency Operations Centre',
  'Work in an Operations Centre',
  'Working with the Media',
];

export const VERTICAL_RESCUE = [
  'Vertical Rescue (PUASAR004B/PUASAR032A)',
];

export const FLOOD_RESCUE = [
  'Swiftwater Rescue Awareness (FR L1)',
  'Flood Rescue Boat Operator (FR L2)',
  'Swiftwater Rescue Technician (FR L3)',
];

export const FLOOD_RESCUE_L1 = 'Swiftwater Rescue Awareness (FR L1)';
export const FLOOD_RESCUE_L2 = 'Flood Rescue Boat Operator (FR L2)';
export const FLOOD_RESCUE_L3 = 'Swiftwater Rescue Technician (FR L3)';

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

export function getDocumentTitle(pageTitle) {
  return `${pageTitle} | WOL SES Availability`;
}

export function getQualificationName(value) {
  switch (value) {
    case 'CHAINSAW_CROSSCUT':
      return 'Chainsaw cross-cut';
    case 'FLOOD_RESCUE_1':
      return 'Flood rescue 1 (on land)';
    case 'FLOOD_RESCUE_2':
      return 'Flood rescue 2 (on water)';
    case 'FLOOD_RESCUE_3':
      return 'Flood rescue 3 (in water)';
    case 'LAND_SEARCH':
      return 'Land search';
    case 'STORM_WATER_DAMAGE':
      return 'Storm water damage';
    case 'VERTICAL_RESCUE':
      return 'Vertical rescue';
    default:
      return 'Unknown qualification';
  }
}

export function getQualificationAbbreviation(value) {
  switch (value) {
    case 'CHAINSAW_CROSSCUT':
      return 'CS';
    case 'FLOOD_RESCUE_1':
      return 'FR1';
    case 'FLOOD_RESCUE_2':
      return 'FR2';
    case 'FLOOD_RESCUE_3':
      return 'FR3';
    case 'LAND_SEARCH':
      return 'LS';
    case 'STORM_WATER_DAMAGE':
      return 'SWD';
    case 'VERTICAL_RESCUE':
      return 'VR';
    default:
      return '?';
  }
}

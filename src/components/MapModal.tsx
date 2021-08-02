import { MemberWithAvailabilityData } from '../queries/availability';

import L from 'leaflet';
import { DateTime, Interval } from 'luxon';
import _ from 'lodash';
import React from 'react';
import Modal from 'react-bootstrap/Modal';
import { FaMobileAlt } from 'react-icons/fa';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import MarkerClusterGroup from 'react-leaflet-markercluster';
import AutoSizer from 'react-virtualized-auto-sizer';

export interface MapModalProps {
  members: MemberWithAvailabilityData[];
  rescue?: boolean;
  onHide?: () => void;
}

function formatMobile(mobile?: string) {
  if (!mobile) {
    return '';
  }

  const nums = mobile.replace(/\s/g, '');

  if (!/[0-9]{10}/.test(nums)) {
    return mobile;
  }

  return [nums.substring(0, 4), nums.substring(4, 7), nums.substring(7, 10)].join(' ');
}

class MapModal extends React.Component<MapModalProps> {
  private map?: L.Map;

  render() {
    const visible = this.props.members.filter(({ member }) => !!member.location);

    if (visible.length === 0) {
      return null;
    }

    // Figure out the current availability.
    const now = DateTime.local();
    const available = visible
      .map(({ availabilities }) => availabilities.find(avail => (
        Interval.fromDateTimes(DateTime.fromISO(avail.start), DateTime.fromISO(avail.end)).contains(now)
      )))
      .map(avail => this.props.rescue ? avail?.rescue : avail?.storm);

    // Calculate the bounds, ignore any points which lie more than 3 standard deviations away
    // from the weighted centre.
    const locations = visible.map(({ member }) => member.location!);
    const centre = locations.reduce(
      (accum, val) => ({ lat: accum.lat + val.lat / visible.length, lng: accum.lng + val.lng / visible.length }),
      { lat: 0, lng: 0 }
    );

    const distances = locations.map(loc => L.CRS.EPSG3857.distance(loc, centre));
    const mean = _.mean(distances);
    const stddev = Math.sqrt(_.sum(distances.map(distance => Math.pow(distance - mean, 2))) / distances.length);

    const limit = distances.length >= 50 ? 1.5 : 3;
    const bounds = L.latLngBounds(locations.filter((_, i) => distances[i] <= limit * stddev));

    const grey = L.icon({
      iconUrl: '/static/leaflet/marker-icon-grey.png',
      iconRetinaUrl: '/static/leaflet/marker-icon-2x-grey.png',
      shadowUrl: '/static/leaflet/marker-shadow.png',
    });

    const green = L.icon({
      iconUrl: '/static/leaflet/marker-icon-green.png',
      iconRetinaUrl: '/static/leaflet/marker-icon-2x-green.png',
      shadowUrl: '/static/leaflet/marker-shadow.png',
    });

    const yellow = L.icon({
      iconUrl: '/static/leaflet/marker-icon-yellow.png',
      iconRetinaUrl: '/static/leaflet/marker-icon-2x-yellow.png',
      shadowUrl: '/static/leaflet/marker-shadow.png',
    });

    const red = L.icon({
      iconUrl: '/static/leaflet/marker-icon-red.png',
      iconRetinaUrl: '/static/leaflet/marker-icon-2x-red.png',
      shadowUrl: '/static/leaflet/marker-shadow.png',
    });

    return (
      <Modal show={true} onHide={this.props.onHide} className='fullscreen-modal'>
        <Modal.Header closeButton>
          <Modal.Title>Member Map</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <AutoSizer onResize={() => this.invalidate()}>
            {({ width, height }) => {
              if (width <= 0 || height <= 0) {
                return null;
              }

              return (
                <MapContainer
                  bounds={bounds}
                  boundsOptions={{ padding: [50, 50] }}
                  style={{ width, height }}
                  whenCreated={map => { this.map = map; }}
                >
                  <TileLayer
                    attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  <MarkerClusterGroup>
                    {visible.map(({ member }, i) => {
                      let icon: L.Icon;

                      switch (available[i]) {
                        case 'AVAILABLE':
                        case 'IMMEDIATE':
                          icon = green;
                          break;
                        case 'SUPPORT':
                          icon = yellow;
                          break;
                        case 'UNAVAILABLE':
                          icon = red;
                          break;
                        default:
                          icon = grey;
                          break;
                      }

                      return (
                        <Marker position={locations[i]} icon={icon} key={member.number}>
                          <Popup>
                            {member.fullName}
                            {member.mobile && (
                              <a className='ml-1' href={`tel:${member.mobile}`}>
                                <FaMobileAlt /> {formatMobile(member.mobile)}
                              </a>
                            )}
                          </Popup>
                        </Marker>
                      );
                    })}
                  </MarkerClusterGroup>
                </MapContainer>
              );
            }}
          </AutoSizer>
        </Modal.Body>
      </Modal>
    );
  }

  invalidate() {
    if (this.map) {
      this.map.invalidateSize();
    }
  }
}

export default MapModal;

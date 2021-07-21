import L from 'leaflet';
import React from 'react';
import Modal from 'react-bootstrap/Modal';
import { FaMobileAlt } from 'react-icons/fa';
import { MapContainer, TileLayer, Marker, Popup, useMap} from 'react-leaflet'
import AutoSizer from 'react-virtualized-auto-sizer';

interface LatLng {
  lat: number;
  lng: number;
}

interface MemberMapData {
  fullName: string;
  mobile?: string;
  location?: LatLng;
}

export interface MapModalProps {
  members: MemberMapData[];
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
    const visible = this.props.members.filter(member => member.location !== undefined);
    const bounds = L.latLngBounds(visible.map(member => member.location!));

    if (visible.length === 0) {
      return null;
    }

    const icon = L.icon({
      iconUrl: '/leaflet/marker-icon.png',
      iconRetinaUrl: '/leaflet/marker-icon-2x.png.png',
      shadowUrl: '/leaflet/marker-shadow.png',
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
                  style={{ width, height }}
                  whenCreated={map => { this.map = map; }}
                >
                  <TileLayer
                    attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  {visible.map((member, index) => (
                    <Marker position={member.location!} icon={icon} key={index}>
                      <Popup>
                        {member.fullName}
                        {member.mobile && (
                          <a className='ml-1' href={`tel:${member.mobile}`}>
                            <FaMobileAlt /> {formatMobile(member.mobile)}
                          </a>
                        )}
                      </Popup>
                    </Marker>
                  ))}
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

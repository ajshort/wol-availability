declare module 'react-leaflet-markercluster' {
  import { Component } from 'react'
  import { MarkerClusterGroupOptions } from 'leaflet'

  export default abstract class MarkerClusterGroup extends Component<MarkerClusterGroupOptions> {}
}

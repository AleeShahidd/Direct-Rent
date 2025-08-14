// Type definitions for Google Maps JavaScript API
// These are simplified types for the Direct-Rent project

declare namespace google {
  namespace maps {
    class Map {
      constructor(mapDiv: Element, opts?: MapOptions);
      setCenter(latLng: LatLng | LatLngLiteral): void;
      setZoom(zoom: number): void;
      getZoom(): number;
      getBounds(): LatLngBounds;
      fitBounds(bounds: LatLngBounds): void;
      addListener(eventName: string, handler: Function): MapsEventListener;
    }

    interface MapOptions {
      center?: LatLng | LatLngLiteral;
      zoom?: number;
      mapTypeControl?: boolean;
      streetViewControl?: boolean;
      fullscreenControl?: boolean;
      zoomControl?: boolean;
      mapTypeId?: string;
      gestureHandling?: string;
      styles?: Array<MapTypeStyle>;
    }

    interface MapTypeStyle {
      featureType?: string;
      elementType?: string;
      stylers: Array<{ [key: string]: any }>;
    }

    class LatLng {
      constructor(lat: number, lng: number);
      lat(): number;
      lng(): number;
      toJSON(): LatLngLiteral;
    }

    interface LatLngLiteral {
      lat: number;
      lng: number;
    }

    class LatLngBounds {
      constructor(sw?: LatLng, ne?: LatLng);
      extend(latLng: LatLng | LatLngLiteral): LatLngBounds;
      getNorthEast(): LatLng;
      getSouthWest(): LatLng;
      isEmpty(): boolean;
    }

    class Marker {
      constructor(opts: MarkerOptions);
      setMap(map: Map | null): void;
      getPosition(): LatLng | null;
      addListener(eventName: string, handler: Function): MapsEventListener;
    }

    interface MarkerOptions {
      position: LatLng | LatLngLiteral;
      map?: Map;
      title?: string;
      animation?: number;
      icon?: string | Icon;
    }

    interface Icon {
      url: string;
      scaledSize?: Size;
    }

    class Size {
      constructor(width: number, height: number);
    }

    class InfoWindow {
      constructor(opts: InfoWindowOptions);
      open(map: Map, anchor?: MVCObject): void;
      close(): void;
    }

    interface InfoWindowOptions {
      content?: string | Node;
      position?: LatLng | LatLngLiteral;
    }

    interface MapMouseEvent {
      latLng: LatLng;
    }

    interface MapsEventListener {
      remove(): void;
    }

    abstract class MVCObject {
      addListener(eventName: string, handler: Function): MapsEventListener;
    }

    enum Animation {
      DROP,
      BOUNCE
    }

    enum MapTypeId {
      ROADMAP,
      SATELLITE,
      HYBRID,
      TERRAIN
    }

    // Places API
    namespace places {
      class Autocomplete extends MVCObject {
        constructor(inputField: HTMLInputElement, opts?: AutocompleteOptions);
        getPlace(): PlaceResult;
        bindTo(bindKey: string, target: MVCObject, targetKey: string): void;
        unbind(key: string): void;
      }

      interface AutocompleteOptions {
        bounds?: LatLngBounds | LatLngBoundsLiteral;
        componentRestrictions?: ComponentRestrictions;
        fields?: string[];
        types?: string[];
      }

      interface ComponentRestrictions {
        country: string | string[];
      }

      interface PlaceResult {
        address_components?: PlaceAddressComponent[];
        formatted_address?: string;
        geometry?: PlaceGeometry;
        name?: string;
        photos?: PlacePhoto[];
        place_id?: string;
        types?: string[];
        url?: string;
        vicinity?: string;
      }

      interface PlaceAddressComponent {
        long_name: string;
        short_name: string;
        types: string[];
      }

      interface PlaceGeometry {
        location: LatLng;
        viewport: LatLngBounds;
      }

      interface PlacePhoto {
        height: number;
        width: number;
        getUrl(opts: PhotoOptions): string;
      }

      interface PhotoOptions {
        maxWidth?: number;
        maxHeight?: number;
      }

      interface LatLngBoundsLiteral {
        east: number;
        north: number;
        south: number;
        west: number;
      }
    }

    // Event handling
    namespace event {
      function addListener(instance: any, eventName: string, handler: Function): MapsEventListener;
      function addDomListener(instance: any, eventName: string, handler: Function, capture?: boolean): MapsEventListener;
      function clearInstanceListeners(instance: any): void;
      function clearListeners(instance: any, eventName: string): void;
    }
  }
}

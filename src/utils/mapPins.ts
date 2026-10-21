import type { Property } from '../types/property'
import type { Listing } from '../types/listing'
import type { MapPin } from '../types/mapPin'
import { toTitleCase } from './format'

export function propertyToPin(property: Property): MapPin {
    return {
        id: property.rera_id,
        title: toTitleCase(property.project_name),
        subtitle: property.place,
        badge: property.project_type,
        lat: property.mandal_lat,
        lon: property.mandal_lon,
        kind: 'rera',
        linkTo: `/properties/${property.rera_id.toLowerCase()}`,
    }
}

export function listingToPin(listing: Listing): MapPin {
    return {
        id: `listing-${listing.id}`,
        title: toTitleCase(listing.project_name),
        subtitle: listing.location,
        badge: `${listing.bhk} BHK`,
        lat: listing.lat,
        lon: listing.lon,
        kind: 'listing',
        linkTo: `/listings/${listing.id}`,
    }
}

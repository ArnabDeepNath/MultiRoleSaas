export interface LocationValue {
  state: string;
  district: string;
  address: string;
}

export interface LocationRecord extends Partial<LocationValue> {
  city?: string;
  location?: string;
}

export const EMPTY_LOCATION: LocationValue = {
  state: "",
  district: "",
  address: "",
};

export function formatLocation(record: LocationRecord): string {
  const parts = [record.address, record.district || record.city, record.state].filter(
    (part): part is string => Boolean(part?.trim())
  );

  if (parts.length > 0) {
    return [...new Set(parts)].join(", ");
  }

  return record.location || "Location not specified";
}

export function matchesLocation(record: LocationRecord, filters: LocationValue): boolean {
  const normalize = (value?: string) => value?.trim().toLowerCase() || "";
  const legacyLocation = normalize(record.location);
  const state = normalize(record.state);
  const district = normalize(record.district);
  const city = normalize(record.city);
  const address = normalize(record.address);

  const stateMatches =
    !filters.state ||
    state === normalize(filters.state) ||
    legacyLocation.includes(normalize(filters.state));
  const districtMatches =
    !filters.district ||
    district === normalize(filters.district) ||
    city === normalize(filters.district) ||
    legacyLocation.includes(normalize(filters.district));
  const addressMatches =
    !filters.address.trim() ||
    [address, legacyLocation, city, district, state].some((value) =>
      value.includes(normalize(filters.address))
    );

  return stateMatches && districtMatches && addressMatches;
}

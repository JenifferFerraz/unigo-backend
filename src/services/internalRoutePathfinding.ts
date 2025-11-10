
export function haversine(a: number[], b: number[]): number {
  const toRad = (deg: number) => deg * Math.PI / 180;
  const R = 6371000; // Earth radius in meters
  const dLat = toRad(b[1] - a[1]);
  const dLng = toRad(b[0] - a[0]);
  const lat1 = toRad(a[1]);
  const lat2 = toRad(b[1]);
  const aVal = Math.sin(dLat/2)**2 + Math.cos(lat1)*Math.cos(lat2)*Math.sin(dLng/2)**2;
  return 2 * R * Math.asin(Math.sqrt(aVal));
}


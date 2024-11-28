// Function to calculate distance between two coordinates using Haversine formula
function getDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // Radius of Earth in kilometers
  const toRadians = (degrees: number) => degrees * (Math.PI / 180);

  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in kilometers
}

// Function to find the closest track
function findClosestTrack(userLat: number, userLon: number, tracks: any[]) {
  let closestTrack: any = null;
  let minDistance = Infinity;

  tracks.forEach((track) => {
    const { coordinates } = track;

    if (coordinates?.latitude && coordinates?.longitude) {
      const distance = getDistance(
        userLat,
        userLon,
        coordinates.latitude,
        coordinates.longitude,
      );

      if (distance < minDistance) {
        minDistance = distance;
        closestTrack = track;
      }
    }
  });

  return closestTrack?.id;
}

export { findClosestTrack };

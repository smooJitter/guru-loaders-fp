// Pure utilities for song swipe analytics
import R from 'ramda';

/**
 * Get the top N entries from an object, sorted by value descending.
 * @param {Object} obj - Object with values to sort.
 * @param {number} n - Number of top entries to return.
 * @returns {Array<{ key: string, count: number }>}
 */
export const getTopN = (obj, n) =>
  R.pipe(
    R.toPairs,
    R.sort(([, a], [, b]) => b - a),
    R.take(n),
    R.map(([key, count]) => ({ key, count }))
  )(obj);

/**
 * Calculate user preferences from an array of swipes (populated with songId).
 * @param {Array} swipes - Array of swipe objects with songId populated.
 * @returns {Object} preferences
 */
export const getUserPreferencesFromSwipes = (swipes) => {
  const genres = {};
  const artists = {};
  const albums = {};
  swipes.forEach(swipe => {
    const song = swipe.songId;
    if (song.genre) genres[song.genre] = (genres[song.genre] || 0) + 1;
    if (song.artist) artists[song.artist?._id?.toString()] = (artists[song.artist?._id?.toString()] || 0) + 1;
    if (song.album) albums[song.album?._id?.toString()] = (albums[song.album?._id?.toString()] || 0) + 1;
  });
  return {
    genres,
    artists,
    albums,
    totalLikes: swipes.length,
    topGenres: getTopN(genres, 5).map(({ key, count }) => ({ genre: key, count })),
    topArtists: getTopN(artists, 5).map(({ key, count }) => ({ artistId: key, count })),
    topAlbums: getTopN(albums, 5).map(({ key, count }) => ({ albumId: key, count })),
  };
}; 
import {
	fetchFromDiscogs,
	fetchFromiTunes,
	fetchFromMusicBrainz,
	fetchFromSpotify,
} from "./axios.js";

export const isError = (e: unknown): e is Error => {
	return typeof e === "object" && e !== null && "message" in e;
};

export const makeDelay = (ms: number) =>
	new Promise((resolve) => setTimeout(resolve, ms));

export const buildSources = (spotifyToken: string | null, delay?: number) => [
	...(process.env.SPOTIFY_CLIENT_ID &&
	process.env.SPOTIFY_CLIENT_SECRET &&
	spotifyToken
		? [
				(artist: string, title: string) =>
					fetchFromSpotify(artist, title, spotifyToken),
			]
		: []),
	(artist: string, title: string) =>
		fetchFromiTunes(artist, title, false, delay ?? 1500),
	(artist: string, title: string) => fetchFromMusicBrainz(artist, title),
	...(process.env.DISCOGS_TOKEN
		? [(artist: string, title: string) => fetchFromDiscogs(artist, title)]
		: []),
];

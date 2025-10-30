import axios from "axios";
import type { SpotifyTokenResponse } from "../types/generics.js";
import type {
	DiscogsResponse,
	ITunesSearchResponse,
	MusicBrainzResponse,
	SpotifyResponse,
} from "../types/index.js";
import { makeDelay } from "./misc.js";

export async function fetchFromiTunes(terms: string[], delay: number) {
	for (const term of terms) {
		try {
			const res = await axios.get<ITunesSearchResponse>(
				"https://itunes.apple.com/search",
				{
					params: { term, media: "music", limit: 3 },
					timeout: 5000,
				},
			);
			const results = res.data.results || [];
			if (results.length) {
				const artwork = results[0].artworkUrl100;
				return artwork.replace("100x100bb", "600x600bb");
			}
		} catch (err) {
			if ([403, 429].includes(err as number)) await makeDelay(delay);
		}
	}
	return null;
}

export async function fetchFromSpotify(
	artist: string,
	title: string,
	spotifyToken: string,
) {
	if (!spotifyToken) throw new Error("No Spotify token set.");
	const query = encodeURIComponent(`track:${title} artist:${artist}`);

	const res = await axios.get<SpotifyResponse>(
		`https://api.spotify.com/v1/search?q=${query}&type=track&limit=1`,
		{
			headers: {
				Authorization: `Bearer ${spotifyToken}`,
			},
		},
	);

	const data = res.data;
	const img = data.tracks?.items?.[0]?.album?.images?.[0]?.url;

	if (!img) return null;

	const imageRes = await axios.get(img, { responseType: "arraybuffer" });
	return imageRes.data;
}

export async function fetchFromMusicBrainz(artist: string, title: string) {
	try {
		const query = encodeURIComponent(`${artist} ${title}`);
		const res = await axios.get<MusicBrainzResponse>(
			"https://musicbrainz.org/ws/2/recording",
			{
				params: { query, fmt: "json", limit: 1 },
				headers: { "User-Agent": "MP3CoverFetcher/1.0 (https://example.com)" },
				timeout: 7000,
			},
		);

		const recording = res.data.recordings?.[0];
		const releaseId = recording?.releases?.[0]?.id;
		if (!releaseId) return null;

		const art = await axios.get(
			`https://coverartarchive.org/release/${releaseId}/front`,
			{
				responseType: "arraybuffer",
				validateStatus: (s) => s < 500,
			},
		);

		return art.status === 200 ? art.data : null;
	} catch {
		return null;
	}
}

export async function getSpotifyToken() {
	try {
		const res = await axios.post<SpotifyTokenResponse>(
			"https://accounts.spotify.com/api/token",
			"grant_type=client_credentials",
			{
				headers: {
					Authorization: `Basic ${Buffer.from(`${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`).toString("base64")}`,
					"Content-Type": "application/x-www-form-urlencoded",
				},
			},
		);

		const data = res.data;
		return data.access_token;
	} catch (_e) {
		return null;
	}
}

export async function fetchFromDiscogs(artist: string, title: string) {
	if (!process.env.DISCOGS_TOKEN) return null;

	try {
		const query = encodeURIComponent(`${artist} ${title}`);
		const res = await axios.get<DiscogsResponse>(
			"https://api.discogs.com/database/search",
			{
				params: { q: query, type: "release", token: process.env.DISCOGS_TOKEN },
				headers: { "User-Agent": "MP3CoverFetcher/1.0" },
				timeout: 7000,
			},
		);

		const img = res.data.results?.find((r) => r.cover_image)?.cover_image;
		if (!img) return null;

		const imageRes = await axios.get(img, { responseType: "arraybuffer" });
		return imageRes.data;
	} catch {
		return null;
	}
}

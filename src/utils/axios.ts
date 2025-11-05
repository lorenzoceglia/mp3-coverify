import axios from "axios";
import type { SpotifyTokenResponse } from "../types/generics.js";
import type {
	DiscogsResponse,
	ITunesSearchResponse,
	MusicBrainzResponse,
	SpotifyResponse,
} from "../types/index.js";
import { makeDelay } from "./misc.js";
import { generateSearchVariations } from "./strings.js";

export const safeFetch = async (
	fn: (artist: string, title: string) => Promise<Buffer | null>,
	artist: string,
	title: string,
) => {
	try {
		return await fn(artist, title);
	} catch (_err) {
		return null;
	}
};

export const fetchFromiTunes = async (
	artist: string,
	title: string,
	delay: number,
) => {
	const variations = generateSearchVariations(artist, title);

	for (const term of variations) {
		try {
			const res = await axios.get<ITunesSearchResponse>(
				"https://itunes.apple.com/search",
				{
					params: { term, media: "music", limit: 3 },
					timeout: 5000,
				},
			);

			const results = res.data.results || [];
			if (!results.length) continue;

			const artworkUrl = results[0].artworkUrl100?.replace(
				"100x100bb",
				"600x600bb",
			);

			if (!artworkUrl) continue;

			const imgRes = await axios.get(artworkUrl, {
				responseType: "arraybuffer",
				timeout: 7000,
			});

			return Buffer.from(imgRes.data);
		} catch (err) {
			if (axios.isAxiosError(err)) {
				const status = err.response?.status;
				if (status && [403, 429].includes(status)) {
					await makeDelay(delay);
				}
			}
		}
	}

	return null;
};

export const fetchFromSpotify = async (
	artist: string,
	title: string,
	spotifyToken: string | null,
): Promise<Buffer | null> => {
	if (!spotifyToken) throw new Error("No Spotify token set.");

	const query = encodeURIComponent(`track:${title} artist:${artist}`);
	const res = await axios.get<SpotifyResponse>(
		`https://api.spotify.com/v1/search?q=${query}&type=track&limit=1`,
		{
			headers: {
				Authorization: `Bearer ${spotifyToken}`,
			},
			timeout: 7000,
		},
	);

	const imgUrl = res.data.tracks?.items?.[0]?.album?.images?.[0]?.url;
	if (!imgUrl) return null;

	const imgRes = await axios.get(imgUrl, {
		responseType: "arraybuffer",
		timeout: 7000,
	});
	return Buffer.from(imgRes.data);
};

export const fetchFromMusicBrainz = async (
	artist: string,
	title: string,
): Promise<Buffer | null> => {
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

		const releaseId = res.data.recordings?.[0]?.releases?.[0]?.id;
		if (!releaseId) return null;

		const art = await axios.get(
			`https://coverartarchive.org/release/${releaseId}/front`,
			{
				responseType: "arraybuffer",
				timeout: 7000,
				validateStatus: (s) => s < 500,
			},
		);

		return art.status === 200 ? Buffer.from(art.data) : null;
	} catch {
		return null;
	}
};

export const getSpotifyToken = async () => {
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
};

export const fetchFromDiscogs = async (artist: string, title: string) => {
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

		const imageRes = await axios.get(img, {
			responseType: "arraybuffer",
			timeout: 7000,
		});

		return Buffer.from(imageRes.data);
	} catch {
		return null;
	}
};

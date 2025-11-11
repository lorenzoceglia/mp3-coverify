import dotenv from "dotenv";
import { ProvidersEnum, type processCoverOptions } from "../types/generics.js";
import {
	fetchFromDiscogs,
	fetchFromiTunes,
	fetchFromMusicBrainz,
	fetchFromSpotify,
	getSpotifyToken,
} from "../utils/axios.js";

dotenv.config();

type ProviderHandler = (
	artist: string,
	title: string,
) => Promise<string | null | Buffer>;

export const processCover = async ({
	provider,
	artist,
	title,
}: processCoverOptions): Promise<string | null | Buffer> => {
	const providerHandlers: Record<ProvidersEnum, ProviderHandler> = {
		[ProvidersEnum.SPOTIFY]: async (artist, title) => {
			const spotifyToken = await getSpotifyToken();
			return spotifyToken
				? fetchFromSpotify(artist, title, spotifyToken, true)
				: null;
		},
		[ProvidersEnum.ITUNES]: (artist, title) =>
			fetchFromiTunes(artist, title, true),
		[ProvidersEnum.MUSICBRAINZ]: (artist, title) =>
			fetchFromMusicBrainz(artist, title, true),
		[ProvidersEnum.DISCOGS]: (artist, title) =>
			fetchFromDiscogs(artist, title, true),
	};

	const handler = providerHandlers[provider];
	return handler ? await handler(artist, title) : null;
};

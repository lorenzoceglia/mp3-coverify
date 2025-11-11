export type FailedEntry =
	| { fileName: string; artist: string; title: string; variations: string[] }
	| { fileName: string; error: string };

export type SpotifyTokenResponse = {
	access_token: string;
	token_type: "Bearer";
	expires_in: number;
};

export type ProcessFolderOptions = {
	generateCovers?: boolean;
	customDelay?: number;
};

export type processCoverOptions = {
	provider: ProvidersEnum;
	artist: string;
	title: string;
};

export enum ProvidersEnum {
	SPOTIFY = "spotify",
	ITUNES = "itunes",
	MUSICBRAINZ = "musicbrainz",
	DISCOGS = "discogs",
}

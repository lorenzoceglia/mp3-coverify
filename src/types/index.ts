export interface DiscogsResponse {
	pagination: {
		per_page: number;
		items: number;
		page: number;
		urls: { last?: string; next?: string };
		pages: number;
	};
	results: Array<{
		id: number;
		title: string;
		thumb: string;
		cover_image: string;
	}>;
}

export interface ITunesSearchResponse {
	resultCount: number;
	results: ITunesSearchResult[];
	status?: number;
}

interface ITunesSearchResult {
	wrapperType: "track" | "collection" | "artist" | string;
	kind?: string; // es. "song", "album"
	artistId?: number;
	collectionId?: number;
	trackId?: number;
	artistName: string;
	collectionName?: string;
	trackName?: string;
	collectionCensoredName?: string;
	trackCensoredName?: string;
	artistViewUrl?: string;
	collectionViewUrl?: string;
	trackViewUrl?: string;
	previewUrl?: string;
	artworkUrl30: string;
	artworkUrl60: string;
	artworkUrl100: string;
	collectionPrice?: number;
	trackPrice?: number;
	releaseDate?: string; // ISO string
	collectionExplicitness?: string;
	trackExplicitness?: string;
	discCount?: number;
	discNumber?: number;
	trackCount?: number;
	trackNumber?: number;
	trackTimeMillis?: number;
	country?: string;
	currency?: string;
	primaryGenreName?: string;
	isStreamable?: boolean;
}

export type MusicBrainzRecording = {
	id: string;
	title: string;
	disambiguation?: string;
	artist_credit: {
		name: string;
		artist: {
			id: string;
			name: string;
			sort_name: string;
		};
	}[];
	releases?: {
		id: string;
		title: string;
		status?: string;
		date?: string;
		country?: string;
		"release-group"?: {
			id: string;
			type?: string;
		};
	}[];
};

export type MusicBrainzResponse = {
	created: string;
	count: number;
	offset: number;
	recordings: MusicBrainzRecording[];
};

export interface SpotifyResponse {
	tracks: Tracks;
}

interface Tracks {
	href: string;
	limit: number;
	next: string | null;
	offset: number;
	previous: string | null;
	total: number;
	items: TrackItem[];
}

interface TrackItem {
	album: Album;
	artists: Artist[];
	available_markets: string[];
	disc_number: number;
	duration_ms: number;
	explicit: boolean;
	external_ids: ExternalIds;
	external_urls: ExternalUrls;
	href: string;
	id: string;
	is_local: boolean;
	is_playable: boolean;
	name: string;
	popularity: number;
	preview_url: string | null;
	track_number: number;
	type: string;
	uri: string;
}

interface Album {
	album_type: string;
	artists: Artist[];
	available_markets: string[];
	external_urls: ExternalUrls;
	href: string;
	id: string;
	images: Image[];
	is_playable: boolean;
	name: string;
	release_date: string;
	release_date_precision: string;
	total_tracks: number;
	type: string;
	uri: string;
}

interface Artist {
	external_urls: ExternalUrls;
	href: string;
	id: string;
	name: string;
	type: string;
	uri: string;
}

interface ExternalUrls {
	spotify: string;
}

interface ExternalIds {
	isrc: string;
}

interface Image {
	height: number;
	width: number;
	url: string;
}

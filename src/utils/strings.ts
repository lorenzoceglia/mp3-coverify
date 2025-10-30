export function sanitizeText(str: string) {
	return str
		.replace(/[_-]/g, " ")
		.replace(/^[0-9]+[.\-\s]*/g, "")
		.replace(/\(.*?\)|\[.*?\]/g, "")
		.replace(
			/\b(original mix|extended mix|clean|dirty|intro|edit|remix|version|track|live|SE|Wingman|VIP)\b/gi,
			"",
		)
		.replace(/\b(feat\.?|ft\.?)\s+[^\s]+/gi, "")
		.replace(/\b\d{2,3} ?bpm\b/gi, "")
		.replace(/\b\d{1,2}[AB]\b/g, "")
		.replace(/\s{2,}/g, " ")
		.replace(/–/g, "-")
		.replace(/Ã¼/g, "ü")
		.replace(/Ã©/g, "é")
		.replace(/Ã/g, "à")
		.trim();
}

export function parseFileName(filename: string) {
	const name = filename.replace(/\.(mp3|MP3)$/, "").trim();

	const clean = name
		.replace(/\b\d{2,3} ?bpm\b/gi, "")
		.replace(/\b\d{1,2}[AB]\b/g, "")
		.replace(/\b(clean|dirty|extended|edit|intro|SE|wingman|VIP)\b/gi, "")
		.replace(/\(.*?\)|\[.*?\]/g, "")
		.replace(/\s{2,}/g, " ")
		.trim();

	const parts = clean.split(" - ");

	if (parts.length === 2) {
		return { artist: parts[0].trim(), title: parts[1].trim() };
	}

	const maybeWords = clean.split(/\s+/);
	if (maybeWords.length > 2 && /^[a-zA-Z]/.test(maybeWords[0])) {
		return {
			artist: maybeWords[0].trim(),
			title: maybeWords.slice(1).join(" ").trim(),
		};
	}

	return { artist: "", title: clean };
}

export function generateSearchVariations(
	artist: string,
	title: string,
): string[] {
	const combinations = new Set([
		`${artist} ${title}`,
		`${title} ${artist}`,
		title,
		artist,
		sanitizeText(`${artist} - ${title}`),
		sanitizeText(`${title} - ${artist}`),
	]);

	return Array.from(combinations).map(sanitizeText).filter(Boolean);
}

export function removeArtistFromTitle(artist: string, title: string) {
	const escapedArtist = artist.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
	const regex = new RegExp(escapedArtist, "i");

	if (regex.test(title)) {
		return title.replace(regex, "").trim();
	}

	return title;
}

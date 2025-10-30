import path from "node:path";
import axios from "axios";
import dotenv from "dotenv";
import fs from "fs-extra";
import ID3 from "node-id3";
import type { FailedEntry, ProcessFolderOptions } from "../types/generics.js";
import {
	fetchFromDiscogs,
	fetchFromiTunes,
	fetchFromMusicBrainz,
	fetchFromSpotify,
	getSpotifyToken,
} from "../utils/axios.js";
import { isError, makeDelay } from "../utils/misc.js";
import {
	generateSearchVariations,
	parseFileName,
	removeArtistFromTitle,
	sanitizeText,
} from "../utils/strings.js";

dotenv.config();

const failedLog: FailedEntry[] = [];

export const processFolder = async (
	folderPath: string,
	options: ProcessFolderOptions = {},
) => {
	const coversDir = path.join(folderPath, "export-covers");
	const generateCovers = options.generateCovers ?? true;
	const delay = options.customDelay ?? 1500;

	const files = await fs.readdir(folderPath);
	const mp3s = files.filter((f) => f.toLowerCase().endsWith(".mp3"));

	if (
		!process.env.DISCOGS_TOKEN ||
		!process.env.SPOTIFY_CLIENT_ID ||
		!process.env.SPOTIFY_CLIENT_SECRET
	) {
		throw new Error("Missing environment variables");
	}

	const spotifyToken = await getSpotifyToken();

	if (generateCovers) {
		await fs.ensureDir(coversDir);
	}

	for (const fileName of mp3s) {
		try {
			const filePath = path.join(folderPath, fileName);
			const tags = ID3.read(filePath);
			let artist = sanitizeText(tags.artist || "");
			let title = sanitizeText(tags.title || "");

			if (!artist || !title) {
				const parsed = parseFileName(fileName);
				artist ||= sanitizeText(parsed.artist);
				title ||= sanitizeText(parsed.title);
			}

			if (!artist && title) {
				const guess = title.match(/^(.*?)(?=\s+[^\s]+$)/);
				if (guess) {
					artist = guess[1].trim();
					title = title.replace(artist, "").trim();
				}
			}

			if (artist && title) {
				title = removeArtistFromTitle(artist, title);
			}

			const variations = generateSearchVariations(artist, title);

			let coverData = null;

			if (spotifyToken) {
				coverData = await fetchFromSpotify(artist, title, spotifyToken);
			}

			if (!coverData) {
				const iTunesURL = await fetchFromiTunes(variations, delay);

				if (iTunesURL) {
					coverData = (
						await axios.get(iTunesURL, { responseType: "arraybuffer" })
					).data;
				}
			}

			if (!coverData) {
				coverData = await fetchFromMusicBrainz(artist, title);
			}

			if (!coverData) {
				coverData = await fetchFromDiscogs(artist, title);
			}

			if (coverData) {
				if (generateCovers) {
					const coverPath = path.join(
						coversDir,
						`${path.parse(fileName).name}.jpg`,
					);

					await fs.writeFile(coverPath, coverData);
				}

				ID3.update(
					{
						image: {
							mime: "image/jpeg",
							type: { id: 3, name: "front cover" },
							description: "",
							imageBuffer: coverData,
						},
					},
					filePath,
				);
			} else {
				failedLog.push({ fileName, artist, title, variations });
			}

			await makeDelay(delay);
		} catch (err) {
			if (isError(err)) {
				failedLog.push({ fileName, error: err.message });
			} else {
				failedLog.push({ fileName, error: err as string });
			}
		}
	}

	if (failedLog.length) {
		const out = failedLog.map((e) => JSON.stringify(e)).join("\n");
		await fs.writeFile(path.join(folderPath, "not_found.log"), out, "utf8");
	}
};

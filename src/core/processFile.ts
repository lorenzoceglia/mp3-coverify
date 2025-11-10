import path from "node:path";
import dotenv from "dotenv";
import fs from "fs-extra";
import ID3 from "node-id3";
import type { FailedEntry } from "../types/generics.js";
import { getSpotifyToken, safeFetch } from "../utils/axios.js";
import { buildSources, isError } from "../utils/misc.js";
import {
	generateSearchVariations,
	getArtistAndTitle,
} from "../utils/strings.js";

dotenv.config();

const failedLog: FailedEntry[] = [];

export const processFile = async (filePath: string) => {
	const fileName = path.basename(filePath);
	const folderPath = path.dirname(filePath);

	try {
		if (path.extname(fileName).toLowerCase() !== ".mp3") {
			failedLog.push({ fileName, error: "Skipped non-MP3 file" });
			return;
		}

		const { artist, title } = getArtistAndTitle(filePath, fileName);
		const spotifyToken = await getSpotifyToken();
		const sources = buildSources(spotifyToken);
		const variations = generateSearchVariations(artist, title);

		let coverData: Buffer | null = null;

		for (const fetcher of sources) {
			try {
				coverData = await safeFetch(fetcher, artist, title);
				if (coverData) break;
			} catch (err) {
				console.warn(
					`Source fetcher failed: ${fetcher.name ?? "unknown"} → ${err}`,
				);
			}
		}

		if (!coverData) {
			failedLog.push({ fileName, artist, title, variations });
			return;
		}

		try {
			ID3.update(
				{
					image: {
						mime: "image/jpeg",
						type: { id: 3, name: "front cover" },
						description: `Cover for ${artist} - ${title}`,
						imageBuffer: coverData,
					},
				},
				filePath,
			);
		} catch (err) {
			failedLog.push({
				fileName,
				error: `ID3 update failed: ${isError(err) ? err.message : String(err)}`,
			});
		}
	} catch (err) {
		failedLog.push({
			fileName,
			error: isError(err) ? err.message : String(err),
		});
	}

	if (failedLog.length) {
		const out = failedLog.map((e) => JSON.stringify(e)).join("\n");
		await fs.writeFile(path.join(folderPath, "not_found.log"), out, "utf8");
	}
};

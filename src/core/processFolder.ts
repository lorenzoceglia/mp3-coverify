import path from "node:path";
import dotenv from "dotenv";
import fs from "fs-extra";
import ID3 from "node-id3";
import type { FailedEntry, ProcessFolderOptions } from "../types/generics.js";
import { getSpotifyToken, safeFetch } from "../utils/axios.js";
import { buildSources, isError, makeDelay } from "../utils/misc.js";
import {
	generateSearchVariations,
	getArtistAndTitle,
} from "../utils/strings.js";

dotenv.config();

const failedLog: FailedEntry[] = [];

export const processFolder = async (
	folderPath: string,
	options: ProcessFolderOptions = {},
) => {
	const coversDir = path.join(folderPath, "export-covers");

	const canGenerateCovers = options.generateCovers ?? true;
	const delay = options.customDelay ?? 1500;

	const files = await fs.readdir(folderPath);
	const mp3s = files.filter((f) => f.toLowerCase().endsWith(".mp3"));

	const spotifyToken = await getSpotifyToken();

	const sources = buildSources(spotifyToken, delay);

	if (canGenerateCovers) {
		await fs.ensureDir(coversDir);
	}

	for (const fileName of mp3s) {
		try {
			const filePath = path.join(folderPath, fileName);
			const { artist, title } = getArtistAndTitle(filePath, fileName);
			const variations = generateSearchVariations(artist, title);
			let coverData: Buffer | null = null;

			for (const fetcher of sources) {
				coverData = await safeFetch(fetcher, artist, title);
				if (coverData) break;
			}

			if (coverData) {
				if (canGenerateCovers) {
					const coverPath = path.join(
						coversDir,
						`${path.parse(fileName).name}.jpg`,
					);

					await fs.writeFile(coverPath, coverData);
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
						error: `ID3 update failed: ${isError(err) ? err.message : err}`,
					});
				}
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

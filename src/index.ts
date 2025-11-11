import dotenv from "dotenv";
import { processCover } from "./core/processCover.js";
import { processFile } from "./core/processFile.js";
import { processFolder } from "./core/processFolder.js";

dotenv.config();

export { processFolder, processFile, processCover };

if (import.meta.url === `file://${process.argv[1]}`) {
	const folderPath = process.argv[2];
	if (!folderPath) {
		console.error("❗ You must specify a folder containing MP3 files.");
		process.exit(1);
	}
	console.log(`🚀 Starting cover download for folder: ${folderPath}`);
	processFile(folderPath);
}

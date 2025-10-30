#!/usr/bin/env node
import { Command } from "commander";
import dotenv from "dotenv";
import { processFolder } from "./core/processFolder.js";

dotenv.config();

const program = new Command();

program
	.argument("<folder>", "Folder containing MP3 files")
	.option("--no-covers", "Do not generate the folder with JPG covers")
	.option(
		"--custom-delay <ms>",
		"Custom delay between API requests in milliseconds",
		(value) => Number.parseInt(value, 10),
		1500,
	)
	.parse(process.argv);

const folderPath = program.args[0];
const options = program.opts();

if (!folderPath) {
	console.error("❗ You must specify a folder containing MP3 files.");
	process.exit(1);
}

console.log(`🚀 Starting cover download for folder: ${folderPath}`);
console.log(`🖼️ Generate covers: ${options.covers ? "Yes" : "No"}`);
console.log(`⏱️ Custom API delay: ${options.customDelay}ms`);

await processFolder(folderPath, {
	generateCovers: options.covers,
	customDelay: options.customDelay,
});

# 🎵 MP3-COVERIFY

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)

Node.js CLI and library to automatically download album covers for MP3 files from multiple sources  
(**Spotify**, **iTunes**, **MusicBrainz**, **Discogs**) and update ID3 tags.

---

## 🧩 Requirements

- Node.js >= 18.0.0
- pnpm >= 8.0.0
- TypeScript >= 5.0 (for development only)
- Git >= 2.30 (for contributing)

---

## ⚙️ Installation

1. Clone the repository:

```bash
git clone https://github.com/lorenzoceglia/mp3-coverify
cd mp3-coverify
```

2. Install dependencies:

```bash
pnpm install
```

3. Create a `.env` file with your API credentials:

```env
DISCOGS_TOKEN=<your_discogs_token>
SPOTIFY_CLIENT_ID=<your_spotify_client_id>
SPOTIFY_CLIENT_SECRET=<your_spotify_client_secret>
```

---

## 🚀 CLI Usage (Local)

```bash
node ./dist/cli.js <folder> [--no-covers] [--custom-delay <ms>]
```

- `<folder>`: path to the folder containing MP3 files.
- `--no-covers`: skip generating JPG cover files (ID3 tags are still updated).
- `--custom-delay <ms>`: delay in milliseconds between API requests (default: 1500).

Example:

```bash
node ./dist/cli.js ./my-music --no-covers --custom-delay 2000
```

Console output:

| Output | Description |
|--------|--------------|
| ❗ You must specify a folder containing MP3 files. | Folder path missing. |
| 🚀 Starting cover download for folder: `<folder>` | Process started. |
| 🖼️ Generate covers: Yes/No | Whether cover images are saved. |
| ⏱️ Custom API delay: `<ms>`ms | Delay between API requests. |

---

## 🌍 CLI Usage (Global Command)

After installing the package globally:

```bash
pnpm install -g mp3-coverify
```

You can run the command directly:

```bash
mp3-coverify <folder> [--no-covers] [--custom-delay <ms>]
```

Example:

```bash
mp3-coverify ./my-music --no-covers --custom-delay 2000
```

---

## 📦 Library Usage

### Process Folder

```ts
import { processFolder } from "mp3-coverify";

await processFolder("/path/to/mp3/folder", {
    generateCovers: true,
    apiDelay: 2000
});
```

#### Options

| Option | Type | Default | Description |
|---------|------|----------|-------------|
| `generateCovers` | boolean | `true` | Whether to save JPG cover files in `export-covers` folder. |
| `apiDelay` | number | `1500` | Delay between API requests (ms). |

### Process Single File

```ts
import { processFile } from "mp3-coverify";

await processFile("/path/to/song.mp3");
```

Processes a single MP3 file and updates its ID3 tag with the album cover. Unlike `processFolder`, this function:

- Does **not** generate cover image files (only updates ID3 tags)
- Does **not** use custom API delay (processes immediately)
- Writes `not_found.log` in the same directory as the file if the cover is not found
- Skips non-MP3 files automatically

### Process Cover (Single Provider)

```ts
import { processCover } from "mp3-coverify";
import { ProvidersEnum } from "mp3-coverify/types/generics";

const coverBuffer = await processCover({
  provider: ProvidersEnum.SPOTIFY,
  artist: "Daft Punk",
  title: "Harder Better Faster Stronger"
});
```

Fetches the album cover from a **specific provider** only. Returns a `Buffer` with the image data, a string in case of error, or `null` if not found.

- Accepts parameters:
    - `provider`: provider to query (required enum)
    - `artist`: artist name
    - `title`: track title
- Useful when you want manual control over which provider to use
- Does **not** update MP3 files or ID3 tags (only returns the cover data)
- `SPOTIFY` requests require a valid token (handled automatically)

#### Parameters `processCoverOptions`

| Field      | Type                  | Required | Description                          |
|------------|-----------------------|----------|--------------------------------------|
| `provider` | `ProvidersEnum`       | Yes      | Provider to fetch cover from         |
| `artist`   | `string`              | Yes      | Artist name                          |
| `title`    | `string`              | Yes      | Track title                          |

#### Available Providers

- `SPOTIFY`
- `ITUNES`
- `MUSICBRAINZ`
- `DISCOGS`

---

## ⚙️ How It Works

1. **MP3 Parsing**  
   Reads artist and title from ID3 tags, or parses filenames if missing. Cleans text for accurate search.

2. **Search Variations**  
   Generates multiple variations of `artist` and `title` for robust API searches.

3. **Cover Fetching**  
   Queries APIs in order: Spotify → iTunes → MusicBrainz → Discogs. Applies delay to avoid rate limits.

4. **Updating MP3 Tags**  
   Updates ID3 front cover and optionally saves covers to `export-covers`.

5. **Error Handling**  
   Logs failed fetches in `not_found.log` with details (`fileName`, `artist`, `title`, `error`).

---

## 🔧 Configuration

- `.env`: API tokens and secrets.
- `export-covers`: Folder for saving downloaded cover images.
- `apiDelay`: Delay between API calls (default 1500 ms).

---

## 🧑‍💻 Development

```bash
pnpm install
pnpm build
node dist/cli.js ./samples
```

---

## 🧱 Contributing

Contributions are welcome! 🎉  
Please read the [CONTRIBUTING.md](./CONTRIBUTING.md) file for setup and contribution guidelines.

---

## 📜 License

This project is licensed under the [MIT License](./LICENSE).

---

## 💡 Notes

- The CLI supports batch folder processing.
- The library can be used programmatically.
- API credentials are required for full functionality.
- `not_found.log` helps track failed cover fetches.
- Global CLI (`mp3-coverify`) lets you run it from anywhere.

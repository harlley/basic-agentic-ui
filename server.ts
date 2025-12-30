import { serve } from "bun";
import { join, extname } from "path";

const PORT = 7860;
const DIST_DIR = "./dist";

serve({
  port: PORT,
  async fetch(req) {
    const url = new URL(req.url);
    let filePath = url.pathname;

    // Default to index.html for root
    if (filePath === "/" || filePath === "") {
      filePath = "/index.html";
    }

    // Attempt to serve the file
    let fullPath = join(DIST_DIR, filePath);
    let file = Bun.file(fullPath);

    if (await file.exists()) {
      return new Response(file);
    }

    // SPA Fallback: If it's not a file request (no extension) or specifically html, serve index.html
    // This avoids serving index.html for missing images/js
    const ext = extname(filePath);
    if (!ext || ext === ".html") {
      const index = Bun.file(join(DIST_DIR, "index.html"));
      return new Response(index);
    }

    return new Response("Not Found", { status: 404 });
  },
});

console.log(`Server running on http://localhost:${PORT}`);


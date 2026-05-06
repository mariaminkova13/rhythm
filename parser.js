export { parseNotemap, parseSplashTexts }

async function parseNotemap(filePath) {
     try {
          const response = await fetch(filePath);
          const text = await response.text();

          // split on 3+ dashes
          const parts = text.split(/^-{3,}$/m);
          const headMatch = parts[0] ? parts[0].trim() : null;
          const bodyMatch = parts[1] ? parts[1].trim() : null;

          const head = {},
               body = [];

          // Parse head
          if (headMatch) {
               const headLines = headMatch.split("\n");
               headLines.forEach((line) => {
                    const [key, value] = line.split(":").map((s) => s.trim());
                    if (key && value) {
                         // Convert to appropriate types
                         if (value == true || value === "true") head[key] = true;
                         else if (value == false || value === "false") head[key] = false;
                         else if (!isNaN(value)) head[key] = Number(value);
                         else head[key] = value;
                    }
               });
          } else {
               throw new Error("header not found, check syntax");
          }

          // Parse body
          if (bodyMatch) {
               const bodyLines = bodyMatch.split("\n");
               bodyLines.forEach((line) => {
                    const trimmed = line.trim();
                    if (trimmed) {
                         body.push(trimmed);
                    }
               });
          } else {
               throw new Error("body not found, check syntax");
          }

          return { head, body };
     } catch (error) {
          console.error("Error reading notemap:", error);
          return null;
     }
}

async function parseSplashTexts() {
     const response = await (await fetch('markup/splashes.txt')).text();
     return response.split("\n")
}
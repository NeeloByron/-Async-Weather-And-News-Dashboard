// Sprint 3: Promise Version
// - create a promiseVersion.ts
// - Chain Promises to fetch weather -> news -> display
// - Implement Promise.all() and Promise.race() examples
import "dotenv/config"
import * as readline from "node:readline";
import * as https from "node:https";

type Weather = { temperature: number; description: string};
type Post = { title: string };
const apiKey = process.env.OPENWEATHER_API_KEY;
const mode = process.argv[2] ?? "chain"

// Turn the HTTPS callbacks into one reusable promise.
function getJson(url: URL | string): Promise<unknown> {
    return new Promise((resolve, reject) => {
     const request = https.get(url, (response) => {
        // collect the response, which arrives in smaller pieces (chunks)
        let body = "";
        // Receive chunks as text instead of binary buffers
        response.setEncoding("utf8");
        // add each chunk to complete response body
        response.on("data", (chunk: string) => {body += chunk; });
        // error if occurs while reading the response
        response.on("error", reject);
        // error if interrupted before finishing
        response.on("aborted", () => reject(new Error("Response interrupted.")));
        // runs the entire response that has been recieved
        response.on("end", () => {
            if (response.statusCode !== 200) {
                reject(new Error(`Request failed: HTTP ${response.statusCode}`));
                return;
            }
             // turns JSON text into javaScript value
            try { resolve(JSON.parse(body)); 
            } catch {
                reject(new Error("Could not read the JSON response."));
            }
        });
      });
      // Handle request-level errors, such as  a connection failure.
      request.on("error", reject);
      // destroy the request after 10 seconds of socket inactivity
      request.setTimeout(10_000, () => {
        request.destroy(new Error("Request time out."));
      });
    });

    // helper function checks whether a value is an object and it is not null
    function isRecord(value: unknown): value is Record<string, unknown> {
        return typeof value === "object" && value !== null;
    }
}



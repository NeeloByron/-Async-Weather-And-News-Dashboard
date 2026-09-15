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

// helper function checks whether a value is an object and it is not null
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

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

}

// this function does two jobs 1. finds the city's map coordinates & uses those coordinates to fetch its weather.
function fetchWeather(city: string, country: string): Promise<Weather> {
    // build the address for finding a city's location
    const locationUrl = new URL("https://api.openweathermap.org/geo/1.0/direct");
    // add the city and country for e.g., "Cape Town, ZA"
    locationUrl.searchParams.set("q", `${city},${country}`);
    // Ask for just one matching location
    locationUrl.searchParams.set("limit", "1");
    // add our API Key
    locationUrl.searchParams.set("appid", apiKey!);
    return getJson(locationUrl)
    
     .then((locations) => {
      if (!Array.isArray(locations) || !isRecord(locations[0]) ||
          typeof locations[0].lat !== "number" || typeof locations[0].lon !== "number") {
            // stop the chain if the location data isn't usable
        throw new Error("City not found or invalid location response.");
      }
      // build the address for fetching weather.
      const weatherUrl = new URL("https://api.openweathermap.org/data/2.5/weather");
      weatherUrl.searchParams.set("lat", String(locations[0].lat));
      weatherUrl.searchParams.set("lon", String(locations[0].lon));
      weatherUrl.searchParams.set("appid", apiKey!);
      weatherUrl.searchParams.set("units", "metric");
      return getJson(weatherUrl);
    })
    .then((weather) => {
        // check that the response contains a temperature that is a number and a weather description that is text 
      if (!isRecord(weather) || !isRecord(weather.main) ||
          typeof weather.main.temp !== "number" || !Array.isArray(weather.weather) ||
          !isRecord(weather.weather[0]) || typeof weather.weather[0].description !== "string") {
        throw new Error("Unexpected weather response.");
      }
      return { temperature: weather.main.temp, description: weather.weather[0].description };
    });
}

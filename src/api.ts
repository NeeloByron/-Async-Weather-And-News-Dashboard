import "dotenv/config"
import https from "node:https"

// weather api call from .env
const apiKey = process.env.OPENWEATHER_API_KEY;
// Read the mode typed after the filename (chain, all or race)
// if no mode was typed use "chain" by default.
const mode = process.argv[2] ?? "chain"

// check that a value is an object and isn't null.
function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null;
}


// if is not the api key then show this error 
if (!apiKey) {
    console.error("OPENWEATHER_API_KEY is not configured.");
    process.exit(1);
}

// fetch text from a url using an error-first callback
 export function fetchData( url: string | URL, callback: (error: Error | null, data?: string) => void) {
  let completed = false;
  // finish operation, reporting either an error or the response text
  function finish(error: Error | null, data?: string) {
    if (completed) {
      return;
    }
    completed = true;
    //on failure: callback(error)
    callback(error, data);
  }

  // send a GET request. this callback runs when the response arrives.
  const request = https.get(url, (response) => {
    let body = "";
     // Read incoming chunks as UTF-8 string instead of binary buffers
    response.setEncoding("utf8");
    response.on("data", (chunk: string) => {
      body += chunk;
    });
     // error handling while recieving the response.
    response.on("error", (error: Error) => {
      finish(error);
    });
    // handle a response that stops before all its data arrives
    response.on("aborted", () => {
      finish(new Error("The response was interrupted."));
    });

    response.on("end", () => {
      if (response.statusCode !== 200) {
        finish(new Error(`Request failed: HTTP ${response.statusCode}`));
        return;
      }

      finish(null, body);
    });
  });

  request.on("error", (error: Error) => {
    finish(error);
  });
}

// finds a city's latitude and longitude and passes them to callback
export function fetchLocation( cityName: string, countryCode: string, callback: ( error: Error | null, location?: { lat: number; lon: number } ) => void) {
  // show which location we are searching for.
  console.log(`Fetching location for ${cityName}, ${countryCode}...`);
  // create the API URL. use a plain URL 
  const url = new URL("https://api.openweathermap.org/geo/1.0/direct");
  // search using the city name and country code such as "Cape Town, ZA"
  url.searchParams.set("q", `${cityName},${countryCode}`);
  // here is asking the API to return at most one matching location.
  url.searchParams.set("limit", "1");
  url.searchParams.set("appid", apiKey!);

  fetchData(url, (error, data) => {
    if (error) {
      callback(error);
      return;
    }
    // declare the variable that will hold the city's coordinates.
    let location: { lat: number; lon: number };

    try {
      const locations = JSON.parse(data!);
      if (!Array.isArray(locations) || locations.length === 0 || typeof locations[0]?.lat !== "number" || typeof locations[0]?.lon !== "number") {
       
        throw new Error("City not found.");
      }
      location = { lat: locations[0].lat, lon: locations[0].lon };
      } catch (error) {
        callback( error instanceof Error? error
          : new Error("Could not read the location data.")
      );
      return;
    }

    callback(null, location);
  });
}

export function fetchWeather( latitude: number, longitude: number, callback: (error: Error | null, weather?: { temperature: number; description: string }) => void) {
  console.log("Fetching weather...");
  const url = new URL("https://api.openweathermap.org/data/2.5/weather");
  url.searchParams.set("lat", String(latitude));
  url.searchParams.set("lon", String(longitude));
  url.searchParams.set("appid", apiKey!);
  url.searchParams.set("units", "metric");

  fetchData(url, (error, data) => {
    if (error) {
      callback(error);
      return;
    }

    let weather: { temperature: number; description: string };

    try {
      const result = JSON.parse(data!);

      if (
        typeof result?.main?.temp !== "number" ||
        typeof result?.weather?.[0]?.description !== "string"
      ) {
        throw new Error("Unexpected weather response.");
      }

      weather = {
        temperature: result.main.temp,
        description: result.weather[0].description,
      };
    } catch (error) {
      callback(
        error instanceof Error
          ? error
          : new Error("Could not read the weather data.")
      );
      return;
    }

    callback(null, weather);
  });
}

export function fetchNews( callback: ( error: Error | null, news?: { title: string }[] ) => void) {
  console.log("Fetching sample headlines...");

  fetchData("https://dummyjson.com/posts?limit=3", (error, data) => {
    if (error) {
      callback(error);
      return;
    }

    let news: { title: string }[];

    try {
      const result = JSON.parse(data!);

      if (
        !Array.isArray(result?.posts) ||
        !result.posts.every(
          (post: { title?: unknown } | null) =>
            typeof post?.title === "string"
        )
      ) {
        throw new Error("Unexpected news response.");
      }

      news = result.posts;
    } catch (error) {
      callback(
        error instanceof Error
          ? error
          : new Error("Could not read the news data.")
      );
      return;
    }

    callback(null, news);
  });
}
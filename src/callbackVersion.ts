// sprint 2: Callback Version
// - Implement fetching weather and news using https module with callback
// - Demonstrate "callback hell" by nesting dependent calls
import "dotenv/config"
import * as readline from "node:readline"; // lets app read text the user types in the terminal.
import * as https from "node:https";

// weather api call from .env
const apiKey = process.env.OPENWEATHER_API_KEY;

// if is not the api key then show this error 
if (!apiKey) {
    console.error("OPENWEATHER_API_KEY is not configured.");
    process.exit(1);
}

// fetch text from a url using an error-first callback
function fetchData( url: string | URL, callback: (error: Error | null, data?: string) => void) {
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

  const request = https.get(url, (response) => {
    let body = "";

    response.setEncoding("utf8");
    response.on("data", (chunk: string) => {
      body += chunk;
    });

    response.on("error", (error: Error) => {
      finish(error);
    });

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

function fetchLocation(
  cityName: string,
  countryCode: string,
  callback: (
    error: Error | null,
    location?: { lat: number; lon: number }
  ) => void
) {
  console.log(`Fetching location for ${cityName}, ${countryCode}...`);

  const url = new URL("https://api.openweathermap.org/geo/1.0/direct");
  url.searchParams.set("q", `${cityName},${countryCode}`);
  url.searchParams.set("limit", "1");
  url.searchParams.set("appid", apiKey!);

  fetchData(url, (error, data) => {
    if (error) {
      callback(error);
      return;
    }

    let location: { lat: number; lon: number };

    try {
      const locations = JSON.parse(data!);

      if (
        !Array.isArray(locations) ||
        locations.length === 0 ||
        typeof locations[0]?.lat !== "number" ||
        typeof locations[0]?.lon !== "number"
      ) {
        throw new Error("City not found.");
      }

      location = {
        lat: locations[0].lat,
        lon: locations[0].lon,
      };
    } catch (error) {
      callback(
        error instanceof Error
          ? error
          : new Error("Could not read the location data.")
      );
      return;
    }

    callback(null, location);
  });
}

function fetchWeather(
  latitude: number,
  longitude: number,
  callback: (
    error: Error | null,
    weather?: { temperature: number; description: string }
  ) => void
) {
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

function fetchNews(
  callback: (
    error: Error | null,
    news?: { title: string }[]
  ) => void
) {
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

const terminal = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

terminal.question("Which city are you in? ", (city) => {
  const cityName = city.trim();

  if (!cityName) {
    console.error("Please enter a city name.");
    terminal.close();
    return;
  }

  terminal.question("Country code (for example, ZA): ", (country) => {
    const countryCode = country.trim().toUpperCase();
    terminal.close();

    if (!/^[A-Z]{2}$/.test(countryCode)) {
      console.error("Please enter a two-letter country code.");
      return;
    }

    // Nested callbacks, matching the style in your screenshots.
    fetchLocation(cityName, countryCode, (error, location) => {
      if (error) {
        console.error("Error fetching location:", error.message);
        return;
      }

      if (location) {
        fetchWeather(location.lat, location.lon, (error, weather) => {
          if (error) {
            console.error("Error fetching weather:", error.message);
            return;
          }

          if (weather) {
            fetchNews((error, news) => {
              if (error) {
                console.error("Error fetching news:", error.message);
                return;
              }

              if (news) {
                console.log(`\nWeather in ${cityName}, ${countryCode}`);
                console.log(`Temperature: ${weather.temperature} °C`);
                console.log(`Conditions: ${weather.description}`);

                console.log("\nSample headlines (DummyJSON):");

                news.forEach((post, index) => {
                  console.log(`${index + 1}. ${post.title}`);
                });
              }
            });
          }
        });
      }
    });
  });
});
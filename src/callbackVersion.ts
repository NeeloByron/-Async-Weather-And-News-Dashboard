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

const terminal = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});

let cityName = "";
let locationRequest: ReturnType<typeof https.get>;

// question about which city you in 
terminal.question("Which city are you in? ", (city) => {
  cityName = city.trim();

    if (!cityName) {
        console.error("Please enter a city name.");
        terminal.close();
        return;
    }

// country code question
terminal.question("country code (for e.g., ZA): ", (country) => {
    const countryCode = country.trim().toLocaleUpperCase();
    terminal.close();

    // error for the country code if invalid/more characters
    if (!/^[A-Z]{2}$/.test(countryCode)) {
        console.error("Please enter a two-letter country code.");
        return;
    }

    const locationUrl = new URL ("https://api.openweathermap.org/geo/1.0/direct");
    locationUrl.searchParams.set("q", `${cityName},${countryCode}`);
    locationUrl.searchParams.set("limit", "1");
    locationUrl.searchParams.set("appid", apiKey);

    // first request: find the city's coordinates
    locationRequest = https.get(locationUrl, (locationResponse) => {
        let locationBody = "";

        locationResponse.setEncoding("utf-8");

        locationResponse.on("data", (chunk: string) => {
            locationBody += chunk;
        });
         // error message
       locationResponse.on("error", (error: Error) => {
        console.error("Location response failed:", error.message);
       });
            // location lookup
       locationResponse.on("end", () => {
        if (locationResponse.statusCode !== 200) {
            console.error(`Location lookup failed: HTTP ${locationResponse.statusCode}`);
            return;
        }
          let location: { lat: number; lon: number };
          try {
            const locations = JSON.parse(locationBody);

            if (
              !Array.isArray(locations) ||
              locations.length === 0 ||
              typeof locations[0]?.lat !== "number" ||
              typeof locations[0]?.lon !== "number"
            ) {
              console.error("City not found.");
              return;
            }

            location = locations[0];
          } catch {
            console.error("Could not read the location data.");
            return;
          }

            const weatherUrl = new URL ("https://api.openweathermap.org/data/2.5/weather");
             // weather searches 
            weatherUrl.searchParams.set("lat", String(location.lat));
            weatherUrl.searchParams.set("lon", String(location.lon));
            weatherUrl.searchParams.set("appid", apiKey);
            weatherUrl.searchParams.set("units", "metric");

            // Nested request: weather depends on the coordinates above.
            const weatherRequest = https.get(weatherUrl, (weatherReponse) => {
                let weatherBody = "";

                weatherReponse.setEncoding("utf-8");

                weatherReponse.on("data", (chunk: string) => {
                    weatherBody += chunk;
                });

                weatherReponse.on("error", (error: Error) => {
                    console.error("Weather response failed:", error.message);
                });

                weatherReponse.on("end", () => {
                    if (weatherReponse.statusCode !== 200) {
                        console.error(`weather request failed: HTTP ${weatherReponse.statusCode}`)
                        return;
                    }
                    
                    try {
                        const weather = JSON.parse(weatherBody);

                        if (
                            typeof weather?.main?.temp !== "number" ||
                            typeof weather?.weather?.[0]?.description !== "string"
                        ) {
                            console.error("Unexpected weather response.");
                            return;
                        }

                        // further nesting for show off callback hell :)
                        const newsRequest = https.get("https://dummyjson.com/posts?limit=3", (newsResponse) => {
                            let newsBody = "";

                             newsResponse.setEncoding("utf8");

                    newsResponse.on("data", (chunk: string) => {
                      newsBody += chunk;
                    });

                    newsResponse.on("error", (error: Error) => {
                      console.error("News response failed:", error.message);
                    });

                    newsResponse.on("end", () => {
                      if (newsResponse.statusCode !== 200) {
                        console.error(
                          `News request failed: HTTP ${newsResponse.statusCode}`
                        );
                        return;
                      }

                      try {
                        const news = JSON.parse(newsBody);

                        if (
                          !Array.isArray(news?.posts) ||
                          !news.posts.every(
                            (post: { title?: unknown } | null) =>
                              typeof post?.title === "string"
                          )
                        ) {
                          console.error("Unexpected news response.");
                          return;
                        }

                        // Both results are available in this inner callback.
                        console.log(`\nWeather in ${cityName}, ${countryCode}`);
                        console.log(`Temperature: ${weather.main.temp} °C`);
                        console.log(
                          `Conditions: ${weather.weather[0].description}`
                        );

                        console.log("\nSample headlines (DummyJSON):");

                        news.posts.forEach(
                          (post: { title: string }, index: number) => {
                            console.log(`${index + 1}. ${post.title}`);
                          }
                        );
                      } catch {
                        console.error("Could not read the news data.");
                      }
                    });
                  }
                );

                newsRequest.on("error", (error: Error) => {
                  console.error("News connection failed:", error.message);
                });
              } catch (error) {
                console.error("Could not read the weather data.");
              }
            });
          });

          weatherRequest.on("error", (error: Error) => {
            console.error("Weather connection failed:", error.message);
          });
      });
    });

    locationRequest.on("error", (error: Error) => {
      console.error("Location connection failed:", error.message);
    });

    console.log("Fetching your weather and sample headlines...");
  });
   });
// sprint 2: Callback Version
// - Implement fetching weather and news using https module with callback
// - Demonstrate "callback hell" by nesting dependent calls
import readline from "node:readline"; // lets app read text the user types in the terminal.
import { fetchLocation, fetchWeather, fetchNews } from './api'

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
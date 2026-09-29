// sprint 2: Callback Version
// - Implement fetching weather and news using https module with callback
// - Demonstrate "callback hell" by nesting dependent calls
import readline from "node:readline"; // lets app read text the user types in the terminal.
import { fetchLocation, fetchWeather, fetchNews } from './api'

// Connect the terminal so the user can type answers
const terminal = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// Asks the user for their city
terminal.question("Which city are you in? ", (city) => {
  const cityName = city.trim();

  // stops if the user didn't enter a city
  if (!cityName) {
    console.error("Please enter a city name.");
    terminal.close();
    return;
  }

  // Asks for the country code to help find the correct city
  terminal.question("Country code (for example, ZA): ", (country) => {
    const countryCode = country.trim().toUpperCase();
    terminal.close();
     // checks that the country code contains exactly two letters.
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

      // an empty location
      if(!location) {
        console.error("No location found. Check your city and country code.");
        return;
      }

      if (location) {
        // Use the coordinates to request weather
        fetchWeather(location.lat, location.lon, (error, weather) => {
          if (error) {
            console.error("Error fetching weather:", error.message);
            return;
          }

          if (weather) {
            // This nested callback starts news fetching after weather arrives
            fetchNews((error, news) => {
              // stops if the news request fails 
              if (error) {
                console.error("Error fetching news:", error.message);
                return;
              }
              if (news) {
                // Display the weather after both requests succeed
                console.log(`\nWeather in ${cityName}, ${countryCode}`);
                console.log(`Temperature: ${weather.temperature} °C`);
                console.log(`Conditions: ${weather.description}`);
                // DummyJSON supplies sample posts rather than real news
                console.log("\nSample headlines (DummyJSON):");
                // Display each title with a number starting at 1
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
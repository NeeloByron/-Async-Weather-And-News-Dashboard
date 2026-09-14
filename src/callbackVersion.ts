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

// question about which city you in 
terminal.question("Which city are you in? ", (city) => {
    const cityName = city.trim();

    if (!cityName) {
        console.error("Please enter a city name.");
        terminal.close();
        return;
    }
})

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

    // first request: find the city's coordinates
    const locationRequest = https.get(locationUrl, (locationResponse) => {
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
          try {
            const locations = JSON.parse(locationBody);

            if (!Array.isArray(locations) || locations.length === 0) {
                console.error("City not found.");
                return;
            }

            const location = locations[0];

            if (
                typeof location?.lat !== "number" || typeof location?.lon !== "number" 
            ) {
                console.error("Location response contains invaild coordinates.");
                return;
            }
          }
       })
    })

    
})
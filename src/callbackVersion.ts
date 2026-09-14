// sprint 2: Callback Version
// - Implement fetching weather and news using https module with callback
// - Demonstrate "callback hell" by nesting dependent calls
import "dotenv/config"
import * as readline from "node:readline";
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

terminal.question("Which city are you in? ", (city) => {
    const cityName = city.trim();

    if (!cityName) {
        console.error("Please enter a city name.");
        terminal.close();
        return;
    }
})
// Sprint 4: AsyncAwaitVersion
// Create asyncAwaitVersion.ts
// - Refactor Promise code to use async/await
// - Handle errors with try...catch
import "dotenv/config"
import * as readline from "node:readline";
import *  as https from "node:https"

// types 
type Weather = { temperature: number; description: string};
type Post = { title: string }

// constant apikey and mode
const apiKey = process.env.OPENWEATHER_API_KEY;
// Read the mode typed after the filename (chain, all or race)
// if no mode was typed use "chain" by default.
const mode = process.argv[2] ?? "chain"
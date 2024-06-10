import fs from "fs";
import path from "path";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";

function parseArgs(args) {
  // Read from sites directory, and get a list of websites.
  const configDir = "./configs"; // Directory containing the config files

  // Read the config files and extract the site names and configs
  const configFiles = fs
    .readdirSync(configDir)
    .filter((file) => file.endsWith(".json"));
  const websites = {};
  var websiteDefault = "";
  configFiles.forEach((file) => {
    const configPath = path.join(configDir, file);
    const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
    if (config.default) {
      websiteDefault = config.site;
    }
    websites[config.site] = config;
  });
  websites["other"] = { site: "other", startUrl: "" };

  var options = yargs(hideBin(args))
    .parserConfiguration({
      "camel-case-expansion": true,
    })
    .option("proxy-urls", {
      alias: "p",
      describe: "Comma separated list of proxies, or 'skip', or 'apify'.",
      type: "string",
      coerce: (arg) => arg.split(","),
      demandOption:
        "Please provide a list of proxy URLs or 'skip' to run without a proxy, or 'apify' to use Apify proxy",
    })
    .option("headless", {
      alias: "H",
      describe: "Run the scraping headless?",
      type: "boolean",
      default: true,
    })
    .option("browser", {
      alias: "b",
      describe: "Browser type",
      type: "string",
      choices: ["chrome", "chromium", "firebox", "webkit"],
      default: "chrome",
    })
    .option("website", {
      alias: "w",
      describe:
        "Website to scrape products from, or full URL if not already mapped.",
      type: "string",
      choices: Object.keys(websites),
      default: websiteDefault,
      coerce: (arg) => {
        var site = websites[arg];
        if (site && arg != "other") {
          return arg;
        } else if (arg.startsWith("http://") || arg.startsWith("https://")) {
          // If the provided value is a valid URL, return it as is
          websites["other"].startUrl = arg;
          return "other";
        } else {
          // If the provided value is neither a predefined website name nor a valid URL, throw an error
          throw new Error("Invalid website name or URL");
        }
      },
    }).argv;

  // Get the selected website's config object
  const websiteConfig = websites[options.website];

  // Assign the website config object to the argv object
  if (websiteConfig) {
    Object.assign(options, { siteConfig: websiteConfig });
  }

  return options;
}

export default { parseArgs };

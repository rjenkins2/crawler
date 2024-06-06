import yargs from "yargs";
import { hideBin } from "yargs/helpers";

function parse_args(args) {
  const options = yargs(hideBin(args))
    .option("proxy_urls", {
      alias: "p",
      describe: "Comma separated list of proxies, or 'skip', or 'apify'.",
      type: "string",
      coerce: (arg) => arg.split(','),
      demandOption: "Please provide a list of proxy URLs or 'skip' to run without a proxy, or 'apify' to use Apify proxy",
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
      describe: "Website URL to scrape products from",
      type: "string",
      default: "https://www.radwell.com/en-US/",
    })
    .argv;

  return options;
}

export default { parse_args };

import yargs from "yargs";
import { hideBin } from "yargs/helpers";

function parse_args(args) {
  const options = yargs(hideBin(args))
    .option("proxy", {
      alias: "p",
      describe: "Proxy Server",
      type: "string",
    })
    .option("username", {
      alias: "u",
      describe: "Proxy Username",
      type: "string",
    })
    .option("password", {
      alias: "p",
      describe: "Proxy Password",
      type: "string",
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
      choices: ["chromium", "firebox", "webkit"],
      default: "chromium",
    })
    .option("website", {
      alias: "w",
      describe: "Website URL to scrape products from",
      type: "string",
      default: "https://www.radwell.com/en-US/",
    })
    .implies("proxy", ["username", "password"]).argv;

  return options;
}

export default { parse_args };

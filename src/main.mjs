#!/usr/bin/env node
import { PlaywrightCrawler, log } from "crawlee";
import { firefox } from "playwright";
import { webkit } from "playwright";
import { chromium } from "playwright";
import { router } from "./auto_router.mjs";
import cli from "./parse_args.mjs";
//import siteMap from './siteMap.js';

function get_launcher(browser) {
  switch (browser) {
    case "chromium":
      return chromium;
    case "firefox":
      return firefox;
    case "webkit":
      return webkit;
    default:
      return chromium;
  }
}

async function main(argv) {
  const otherOptions = {
    headless: argv.headless,
    launcher: get_launcher(argv.browser),
  };
  const proxyOptions = argv.proxy
    ? {
        proxy: {
          server: argv.proxy,
          username: argv.username,
          password: argv.password,
        },
      }
    : {};
  const launchOptions = Object.assign(otherOptions, proxyOptions);

  log.debug('Starting crawler')

  const crawler = new PlaywrightCrawler({
    maxRequestsPerCrawl: 100,
    proxyConfiguration,
    launchContext: launchOptions,
    requestHandler: router,
  });

  await crawler.addRequests([argv.website]);
  await crawler.run();
}

// Get command line options
const options = cli.parse_args(process.argv);

main(options);

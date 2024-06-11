#!/usr/bin/env node
import { PlaywrightCrawler, ProxyConfiguration, Dataset, log, CriticalError } from "crawlee";
import { Actor } from "apify";
import playwright from "playwright";
import dynamicRouter from "./dynamic_router.mjs";
import cli from "./parse_args.mjs";

async function setupProxy(proxyUrls) {
  if (proxyUrls.length == 1 && proxyUrls[0] === "apify") {
    log.info("Using Apify proxy");
    await Actor.init();
    return await Actor.createProxyConfiguration({
      groups: ["RESIDENTIAL"],
      countryCode: "US",
    });
  } else if (proxyUrls.length == 1 && proxyUrls[0] === "skip") {
    log.info("Skipping proxy");
    return undefined;
  } else {
    log.info("Using custom proxy");
    return new ProxyConfiguration({
      proxyUrls: proxyUrls,
    });
  }
}

async function runCrawlerWithTimeout(crawler, timeout) {
  try {
    const timeoutId = setTimeout(() => {
      throw new CriticalError("Crawl timeout reached");
    }, timeout);

    await crawler.run();

    clearTimeout(timeoutId); // Clear the timeout if the crawl completes before the timeout
  } catch (error) {
    if (error instanceof CriticalError && error.message === "Crawl timeout reached") {
      log.warning("Crawl timeout reached. Stopping the crawl.");
    } else {
      log.error("Crawl failed:", error);
    }
  } finally {
    const dataset = await Dataset.getData();
    console.log(dataset);
  }
}

async function main(options) {
  const { browser, headless, siteConfig, proxyUrls, timeout } = options;

  if (!siteConfig.handlers) {
    const NO_HANDLERS_ERROR = [
      "No handlers found in site config, exiting.",
      "Site hasn't been configured yet. Future versions will allow for automatic configuration.",
    ].join(" ");
    log.error(NO_HANDLERS_ERROR);

    process.exitCode = 1;
    return;
  }

  const channel = ["chrome", "msedge"].includes(browser) ? browser : undefined;
  const proxyConfiguration = await setupProxy(proxyUrls);
  const launchOptions = {
    headless,
    channel,
    args: ["--disable-web-security"],
  };

  log.debug("Starting crawler");

  const launcher = playwright[browser === "chrome" ? "chromium" : browser];
  const router = dynamicRouter.createHandlersFromConfig(siteConfig);
  const crawlerOptions = {
    maxRequestsPerCrawl: 1000,
    maxConcurrency: 5,
    proxyConfiguration,
    sessionPoolOptions: {
      sessionOptions: {
        maxUsageCount: 5,
      },
    },
    launchContext: {
      launcher,
      useChrome: browser === "chrome",
      launchOptions,
    },
    requestHandler: router,
  };

  const crawler = new PlaywrightCrawler(crawlerOptions);

  await crawler.addRequests([siteConfig.startUrl]);

  // Run the crawler with a 30 second timeout.
  await runCrawlerWithTimeout(crawler, timeout);

  log.debug("Crawler finished");

  if (Actor.initialized) {
    await Actor.exit();
  }
}

// Get command line options
const options = cli.parseArgs(process.argv);

main(options);

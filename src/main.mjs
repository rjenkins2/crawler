#!/usr/bin/env node
import { PlaywrightCrawler, ProxyConfiguration, log } from "crawlee";
import { Actor } from "apify";
import playwright from "playwright";
import { router } from "./router.mjs";
import cli from "./parse_args.mjs";
//import siteMap from './siteMap.js';

async function main(argv) {
  const otherOptions = {
    headless: argv.headless,
    args: ['--disable-web-security'],
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

  var proxyConfiguration;
  var apifyProxy = false;

  if (argv.proxy_urls.length == 1 && argv.proxy_urls[0] === 'apify') {
    log.info('Using Apify proxy');
    apifyProxy = true;

    await Actor.init();

    proxyConfiguration = await Actor.createProxyConfiguration({
      groups: ['RESIDENTIAL'],
      countryCode: 'US',
    });
  } else if (argv.proxy_urls.length == 1 && argv.proxy_urls[0] === 'skip') {
    log.info('Skipping proxy');
    proxyConfiguration = undefined
  } else {
    log.info('Using custom proxy');
    proxyConfiguration = new ProxyConfiguration({
      proxyUrls: argv.proxy_urls,
    });
  }

  log.debug('Starting crawler')

  const launcher = playwright[argv.browser === 'chrome' ? 'chromium' : argv.browser];

  const crawler = new PlaywrightCrawler({
    maxRequestsPerCrawl: 100,
    proxyConfiguration,
    sessionPoolOptions: {
      sessionOptions: {
        maxUsageCount: 20,
      },
    },
    launchContext: {
      launcher: launcher,
      useChrome: argv.browser === 'chrome',
      launchOptions: launchOptions,
    },
    requestHandler: router,
  });

  await crawler.addRequests([argv.website]);
  await crawler.run();

  if (apifyProxy) {
    await Actor.exit();
  }
}

// Get command line options
const options = cli.parse_args(process.argv);

main(options);

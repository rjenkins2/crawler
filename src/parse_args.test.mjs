import cli from "./parse_args.mjs";

describe("parseArgs", () => {
  it("should parse arguments", () => {
    const args = [
      "/bin/node",
      "./src/main.mjs",
      "--proxy-urls",
      "http://example.com",
      "--headless",
      "false",
      "--browser",
      "chromium",
      "--website",
      "radwell",
    ];
    const options = cli.parseArgs(args);

    expect(options).toMatchObject({
      proxyUrls: ["http://example.com"],
      headless: false,
      browser: "chromium",
      website: "radwell",
      timeout: 30000,
    });
  });

  it("should return extracted website config", () => {
    const args = [
      "/bin/node",
      "./src/main.mjs",
      "--proxy-urls",
      "http://example.com",
      "--headless",
      "false",
      "--browser",
      "chromium",
      "--website",
      "radwell",
    ];
    const options = cli.parseArgs(args);

    expect(options.siteConfig).toMatchObject({
      default: true,
      site: "radwell",
      startUrl: "https://www.radwell.com/AllCategories/Index",
    });
  });
});

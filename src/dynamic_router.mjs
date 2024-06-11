import { createPlaywrightRouter, Dataset } from "crawlee";

function createHandlersFromConfig(config) {
  const router = createPlaywrightRouter();

  router.addDefaultHandler(async ({ request, page, enqueueLinks, log }) => {
    const label = request.userData.label;
    const handler = config.handlers[label] || config.handlers.default;
    const row = {};

    log.info(`Extracting data: ${request.url}`);

    if (handler) {
      for (const handlerConfig of handler) {
        switch (handlerConfig.action) {
          case "enqueue":
            await page.waitForSelector(handlerConfig.selector);
            await enqueueLinks({
              selector: handlerConfig.selector,
              label: handlerConfig.actionLabel,
              limit: handlerConfig.enqueueLimit,
            });
            break;
          case "extract":
            const data = await page.$eval(handlerConfig.selector, (el) =>
              el.lastChild.textContent.trim(),
            );
            log.info(`Extracted ${handlerConfig.actionLabel}: ${data}`);
            row = saveData(
              row,
              handlerConfig.actionLabel,
              data,
              handlerConfig.type,
            );
            break;
          case "extractOnly":
            const info = await page.$eval(handlerConfig.selector, (el) =>
              el.textContent.trim(),
            );
            log.info(`Extracted ${handlerConfig.actionLabel}: ${info}`);
            row = saveData(
              row,
              handlerConfig.actionLabel,
              info,
              handlerConfig.type,
            );
            break;
          default:
            log.error(`Unknown action: ${handlerConfig.action}`);
            break;
        }
      }

      log.info(`Saving data: ${request.url}`);
      await Dataset.pushData(row);
    }
  });

  return router;
}

function saveData(row, actionLabel, data, type) {
  const keys = actionLabel.split("/");

  let target = row;
  for (let i = 0; i < keys.length - 1; i++) {
    if (!target[keys[i]]) {
      target[keys[i]] = {};
    }
    target = target[keys[i]];
  }
  switch (type) {
    case "float":
      data = parseFloat(data.replace(/[^0-9.]+/g, ""));
    case "number":
      data = Number(data.replace(/[^0-9]+/g, ""));
      break;
    case "boolean":
      data = data === "true";
      break;
    default:
      break;
  }
  target[keys[keys.length - 1]] = data;
  return row;
}

export default { createHandlersFromConfig };

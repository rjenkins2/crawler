import { createPlaywrightRouter, Dataset } from "crawlee";

function createHandlersFromConfig(config) {
  const router = createPlaywrightRouter();

  router.addDefaultHandler(async ({ request, page, enqueueLinks, log }) => {
    const label = request.userData.label;
    const handler = config.handlers[label] || config.handlers.default;
    let row = {};

    log.info(`Extracting data: ${request.url}`);

    if (handler) {
      for (const handlerConfig of handler) {
        const { action, actionLabel, type, selector, enqueueLimit } = handlerConfig;
        let data = null;

        switch (action) {
          case "enqueue":
            await page.waitForSelector(selector);
            await enqueueLinks({
              selector: selector,
              label: actionLabel,
              limit: enqueueLimit,
            });
            break;
          case "extract":
            try {
              data = await page.$eval(selector, (el) => (el ? el.lastChild.textContent.trim() : null));
              log.info(`Extracted ${actionLabel}: ${data}`);
            } catch (error) {
              if (error.message.includes("Failed to find element matching selector")) {
                data = null;
              } else {
                log.error(`Error extracting ${actionLabel}: ${error.message}`);
                throw error;
              }
            }
            row = saveData(row, actionLabel, data, type);
            break;
          case "extractOnly":
            try {
              data = await page.$eval(selector, (el) => (el ? el.textContent.trim() : null));
              log.info(`Extracted ${actionLabel}: ${data}`);
            } catch (error) {
              if (error.message.includes("Failed to find element matching selector")) {
                data = null;
              } else {
                log.error(`Error extracting ${actionLabel}: ${error.message}`);
                throw error;
              }
            }
            row = saveData(row, actionLabel, data, type);
            break;
          default:
            log.error(`Unknown action: ${action}`);
            break;
        }
      }

      if (Object.keys(row).length > 0) {
        log.info(`Saving data: ${request.url}`);
        await Dataset.pushData(row);
      }
    }
  });

  return router;
}

/**
 * Saves the extracted data in a nested structure within the row object.
 *
 * @param {Object} row - The row object to save the data in.
 * @param {string} actionLabel - The label describing the data. If it has a slash, a nested structure is assumed.
 * @param {string|null} data - The data to be saved. It can be a string or null if the data is not found.
 * @param {string} [type] - The type of the data for conversion. Possible values: "float", "number", "boolean".
 * @returns {Object} The updated row object with the saved data.
 *
 * @example
 * const row = {};
 * row = saveData(row, "prices/new/price", "$19.99", "float");
 * console.log(row); // { prices: { new: { price: 19.99 } } }
 * row = saveData(row, "prices/new/available", "true", "boolean");
 * console.log(row); // { prices: { new: { price: 19.99, available: true } }
 * row = saveData(row, "prices/new/sku", "ABC1023");
 * console.log(row); // { prices: { new: { price: 19.99, available: true, sku: "ABC1023" } }
 */
export function saveData(row, actionLabel, data, type) {
  const keys = actionLabel.split("/");

  let target = row;
  for (let i = 0; i < keys.length - 1; i++) {
    if (!target[keys[i]]) {
      target[keys[i]] = {};
    }
    target = target[keys[i]];
  }
  if (data) {
    switch (type) {
      case "float":
        data = parseFloat(data.replace(/[^0-9.]+/g, ""));
        break;
      case "number":
        data = Number(data.replace(/[^0-9]+/g, ""));
        break;
      case "boolean":
        data = data === "true";
        break;
      default:
        break;
    }
  } else {
    data = null;
  }
  target[keys[keys.length - 1]] = data;
  return row;
}

export default { createHandlersFromConfig };

import { saveData } from "./dynamic_router.mjs";

describe("saveData", () => {
  it("should save data in a flat structure within the row object", () => {
    const row = {};
    const actionLabel = "name";
    const data = "John Doe";

    const updatedRow = saveData(row, actionLabel, data);

    expect(updatedRow).toEqual({ name: "John Doe" });
  });

  it("should save data in a nested structure within the row object", () => {
    const row = {};
    const actionLabel = "prices/product/price";
    const data = "$19.99";
    const type = "float";

    const updatedRow = saveData(row, actionLabel, data, type);

    expect(updatedRow).toEqual({
      prices: {
        product: {
          price: 19.99,
        },
      },
    });
  });

  it("should handle missing data parameter and save null", () => {
    const row = {};
    const actionLabel = "prices/product/price";

    const updatedRow = saveData(row, actionLabel);

    expect(updatedRow).toEqual({
      prices: {
        product: {
          price: null,
        },
      },
    });
  });

  it("should handle missing type parameter and save data as-is", () => {
    const row = {};
    const actionLabel = "prices/product/price";
    const data = "$19.99";

    const updatedRow = saveData(row, actionLabel, data);

    expect(updatedRow).toEqual({
      prices: {
        product: {
          price: "$19.99",
        },
      },
    });
  });

  it("should handle boolean type parameter and convert data to boolean", () => {
    const row = {};
    const actionLabel = "prices/product/available";
    const data = "true";
    const type = "boolean";

    const updatedRow = saveData(row, actionLabel, data, type);

    expect(updatedRow).toEqual({
      prices: {
        product: {
          available: true,
        },
      },
    });
  });

  it("should handle number type parameter and convert data to number", () => {
    const row = {};
    const actionLabel = "prices/product/quantity";
    const data = "10 items";
    const type = "number";

    const updatedRow = saveData(row, actionLabel, data, type);

    expect(updatedRow).toEqual({
      prices: {
        product: {
          quantity: 10,
        },
      },
    });
  });

  it("should handle optional type parameter and save data as-is", () => {
    const row = {};
    const actionLabel = "info/name";
    const data = "John Doe";

    const updatedRow = saveData(row, actionLabel, data);

    expect(updatedRow).toEqual({
      info: {
        name: "John Doe",
      },
    });
  });

  it("should handle null data and save it as null", () => {
    const row = {};
    const actionLabel = "info/address";
    const data = null;

    const updatedRow = saveData(row, actionLabel, data);

    expect(updatedRow).toEqual({
      info: {
        address: null,
      },
    });
  });

  it("should append data to existing nested structure", () => {
    const row = {
      prices: {
        product: {
          price: 19.99,
        },
      },
    };
    const actionLabel = "prices/product/quantity";
    const data = "10 items";
    const type = "number";

    const updatedRow = saveData(row, actionLabel, data, type);

    expect(updatedRow).toEqual({
      prices: {
        product: {
          price: 19.99,
          quantity: 10,
        },
      },
    });
  });
});

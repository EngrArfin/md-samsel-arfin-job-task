const url = "YOUR_GOOGLE_SPREADSHEET_URL";
const startDate = "01-01-2023";
const endDate = "07-01-2023";

const axios = require("axios");
const moment = require("moment");

async function fetchSheetData(sheetName) {
  try {
    const spreadsheetId = url.split("/d/")[1].split("/")[0];
    const apiUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${sheetName}?alt=json&key=YOUR_API_KEY`;
    const response = await axios.get(apiUrl);
    const rows = response.data.values;
    const headers = rows.shift();
    return rows.map((row) =>
      Object.fromEntries(headers.map((header, index) => [header, row[index]]))
    );
  } catch (error) {
    console.error("Error fetching data from Google Sheets:", error);
    process.exit(1);
  }
}

async function findBestDayToSave() {
  try {
    const orders = await fetchSheetData("Orders");
    const lineItems = await fetchSheetData("LineItems");

    const filteredOrders = orders.filter((order) => {
      const orderDate = moment(order["Order Date"], "DD-MM-YYYY");
      return orderDate.isBetween(
        moment(startDate, "DD-MM-YYYY"),
        moment(endDate, "DD-MM-YYYY"),
        "day",
        "[]"
      );
    });

    const orderPrices = filteredOrders.reduce((acc, order) => {
      const lineItemsForOrder = lineItems.filter(
        (lineItem) => lineItem["Order ID"] === order["Order ID"]
      );
      const totalPrice = lineItemsForOrder.reduce(
        (sum, item) => sum + parseFloat(item["Price"]),
        0
      );
      const date = order["Order Date"];
      acc[date] = (acc[date] || 0) + totalPrice;
      return acc;
    }, {});

    const bestDay = Object.entries(orderPrices).reduce(
      (minDay, [date, totalPrice]) => {
        if (minDay === null || totalPrice < minDay.totalPrice) {
          return { date, totalPrice };
        }
        return minDay;
      },
      null
    );

    console.log(
      `Best day to save: ${bestDay.date} with total price: ${bestDay.totalPrice}`
    );
  } catch (error) {
    console.error("Error in processing:", error);
  }
}

findBestDayToSave();

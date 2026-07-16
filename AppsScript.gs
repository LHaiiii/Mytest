function doPost(e) {
  try {
    const payload = JSON.parse(e.postData.contents || "{}");
    const spreadsheetUrl =
      "https://docs.google.com/spreadsheets/d/1HV1DM5KaLyVU4r5BE2Xl5-4MaOUVW75MMEKGX1xpPLo/edit?usp=sharing";
    const spreadsheet = SpreadsheetApp.openByUrl(spreadsheetUrl);
    const sheet = spreadsheet.getSheets()[0];

    const row = [
      payload.sender || "",
      Array.isArray(payload.selectedFoods)
        ? payload.selectedFoods.join(", ")
        : "",
      payload.timestamp || new Date().toISOString(),
      payload.source || "",
    ];

    sheet.appendRow(row);

    return ContentService.createTextOutput(
      JSON.stringify({ status: "success" }),
    ).setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(
      JSON.stringify({ status: "error", message: error.message }),
    ).setMimeType(ContentService.MimeType.JSON);
  }
}

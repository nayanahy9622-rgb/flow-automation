import { ConnectorAuth } from "./connectorStore";

type GoogleFile = { id: string; name: string; modifiedTime?: string; webViewLink?: string };
type GoogleSheet = { properties?: { title?: string; index?: number } };

async function googleJson(url: string, token: string) {
  const response = await fetch(url, {
    headers: { authorization: "Bearer " + token, accept: "application/json" },
    cache: "no-store",
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = typeof body?.error?.message === "string" ? body.error.message : "Google API request failed";
    throw new Error("Google Sheets API (" + response.status + "): " + message);
  }
  return body;
}

export async function googleSheetsData(auth: ConnectorAuth) {
  if (!auth.accessToken) throw new Error("Google Sheets access token is missing");

  const query = new URLSearchParams({
    q: "mimeType='application/vnd.google-apps.spreadsheet' and trashed=false",
    pageSize: "20",
    orderBy: "modifiedTime desc",
    fields: "files(id,name,modifiedTime,webViewLink),nextPageToken",
  });
  const listing = await googleJson("https://www.googleapis.com/drive/v3/files?" + query.toString(), auth.accessToken);
  const files = Array.isArray(listing.files) ? listing.files.slice(0, 10) as GoogleFile[] : [];

  const spreadsheets = await Promise.all(files.map(async (file) => {
    const metadata = await googleJson(
      "https://sheets.googleapis.com/v4/spreadsheets/" + encodeURIComponent(file.id) + "?fields=spreadsheetId,properties(title),sheets(properties(title,index))",
      auth.accessToken,
    );
    const sheets: GoogleSheet[] = Array.isArray(metadata.sheets) ? metadata.sheets : [];
    const firstSheet = sheets.slice().sort((a, b) => Number(a.properties?.index || 0) - Number(b.properties?.index || 0))[0];
    const title = typeof firstSheet?.properties?.title === "string" ? firstSheet.properties.title : "";
    if (!title) {
      return { id: file.id, name: file.name, modifiedTime: file.modifiedTime, webViewLink: file.webViewLink, sheetTitle: null, values: [] };
    }
    const range = "'" + title.replace(/'/g, "''") + "'!A1:Z100";
    const valuesUrl = "https://sheets.googleapis.com/v4/spreadsheets/" + encodeURIComponent(file.id) + "/values/" + encodeURIComponent(range);
    const values = await googleJson(valuesUrl, auth.accessToken);
    return {
      id: file.id,
      name: file.name,
      modifiedTime: file.modifiedTime,
      webViewLink: file.webViewLink,
      sheetTitle: title,
      range: values.range || range,
      values: Array.isArray(values.values) ? values.values : [],
    };
  }));

  return {
    source: "Google Sheets API",
    spreadsheetCount: spreadsheets.length,
    truncated: Boolean(listing.nextPageToken) || (Array.isArray(listing.files) && listing.files.length > 10),
    spreadsheets,
  };
}

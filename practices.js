/*! 練習系 */
const request = require('./lib/request');

/**
 * Google Sheets を読み込む
 * 
 * @param {string} spreadsheetId Google Sheets ID
 * @param {string} sheetTitle シート名
 * @param {string} apiKey API Key
 * @return {Array<Array<string>>} 映画情報
 */
async function practiceReadSheet(spreadsheetId, sheetTitle, apiKey) {
  const result = await request(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${sheetTitle}?key=${apiKey}`);
  const json = JSON.parse(result);
  json.values.shift();  // 見出し行を削る
  const films = json.values;
  return films;
}

/**
 * 練習 : 末尾に行追加してデータを書き込む
 * 
 * NOTE : https://developers.google.com/sheets/api/reference/rest/v4/spreadsheets.values/append
 * 
 * @param {sheets_v4.Sheets} sheets Google Sheets
 */
async function practiceAppend(sheets) {
  const result = await sheets.spreadsheets.values.append({
    spreadsheetId   : spreadsheetId,
    range           : `${sheetTitle}!A:I`,  // 必須・行数を指定しても意味はない・指定した列の末尾に行追加する・途中に空行があっても必ず末尾になる空行を探して末尾に追加するようだ
    valueInputOption: 'RAW',                // 入力値を数式として解釈させたりしない
    insertDataOption: 'INSERT_ROWS',        // 行追加にする・`OVERWRITE` にしても今回の場合あまり挙動に変化はない
    includeValuesInResponse: true,          // レスポンスに追加したデータを含める
    requestBody: {
      values: [
        ['TEST A', 'TEST B', 'TEST C', 'TEST D', 'TEST E', 'TEST F', 'TEST G', 'TEST H', 'TEST I']  // I 列以降は非公開列
      ]
      //majorDimension: 'ROWS'                 // 二次元配列の親を行・子を列とする (デフォルト値)・逆にするには `COLUMNS`
      //range         : `${sheetTitle}!A1:I1`  // 効果が分からない・要らないかと
    }
    //responseValueRenderOption   : 'FORMATTED_VALUE'   // 数式を計算した形でデータを返す (デフォルト値)
    //responseDateTimeRenderOption: 'FORMATTED_STRING'  // `responseValueRenderOption: 'FORMATTED_VALUE'` (デフォルト値) の場合は無視される
  });
  console.log(result.data.updates);
}

require('dotenv').config();
const fs                = require('fs').promises;
const path              = require('path');
const googleSheets      = require('@googleapis/sheets');
const logUtils          = require('../lib/log-utils');
const setupOAuth2Client = require('../lib/setup-oauth2-client');

/** Google Sheets ID : スプレッドシートの URL 中に含まれる */
const spreadsheetId       = process.env.SPREAD_SHEET_ID;
/** シート名 */
const sheetTitle          = process.env.SHEET_TITLE;
/** ファイルを出力するディレクトリ名 (なければ生成する) */
const outputDirectoryPath = path.resolve(__dirname, '../outputs');
/** 出力する JSON ファイル名 */
const outputJsonFilePath  = path.resolve(__dirname, '../outputs/filmdex.json');

/*! FilmDeX シートを取得し JSON 形式で書き出す (登録データの重複確認などに利用する) */
(async () => {
  const functionName = 'Get Sheet';
  logUtils.startLog(functionName);
  
  // 環境変数を確認する
  if(spreadsheetId == null || spreadsheetId === '') {
    console.error('Spread Sheet ID Is Empty. Please Set Environment Variable "SPREAD_SHEET_ID"');
    return logUtils.finishedLog(functionName);
  }
  if(sheetTitle == null || sheetTitle === '') {
    console.error('Sheet Title Is Empty. Please Set Environment Variable "SHEET_TITLE"');
    return logUtils.finishedLog(functionName);
  }
  
  // Google Sheets API を用意する
  let sheets = null;
  try {
    const oAuth2Client = await setupOAuth2Client();
    sheets = googleSheets.sheets({
      version: 'v4',
      auth   : oAuth2Client
    });
  }
  catch(error) {
    logUtils.errorLog(error, 'Failed To Setup OAuth2Client');
    return logUtils.finishedLog(functionName);
  }
  
  // シートのデータを取得する
  let sheet = null;
  try {
    const sheetResult = await sheets.spreadsheets.values.get({
      spreadsheetId: spreadsheetId,
      range        : `${sheetTitle}!A:H`  // I 列以降は非公開の列なので取得しない
    });
    sheet = sheetResult.data.values;
  }
  catch(error) {
    logUtils.errorLog(error, 'Failed To Get Sheet');
    return logUtils.finishedLog(functionName);
  }
  
  // シートを書き出す
  try {
    await fs.mkdir(outputDirectoryPath, { recursive: true });
    await fs.writeFile(outputJsonFilePath, JSON.stringify(sheet, null, '  ') + '\n', 'utf8');
  }
  catch(error) {
    logUtils.errorLog(error, 'Failed To Write File');
    return logUtils.finishedLog(functionName);
  }
  
  logUtils.finishedLog(functionName);
})();

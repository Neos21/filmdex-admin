require('dotenv').config();
const fs                         = require('fs').promises;
const path                       = require('path');
const googleSheets               = require('@googleapis/sheets');
const detectRowIndexOfAddingFilm = require('../lib/detect-row-index-of-adding-film');
const logUtils                   = require('../lib/log-utils');
const parseJsonc                 = require('../lib/parse-jsonc');
const readText                   = require('../lib/read-text');
const setupOAuth2Client          = require('../lib/setup-oauth2-client');

/** Google Sheets ID : スプレッドシートの URL 中に含まれる */
const spreadsheetId      = process.env.SPREAD_SHEET_ID;
/** シート名 */
const sheetTitle         = process.env.SHEET_TITLE;
/** 登録したい映画情報を書いた JSONC ファイルのパス */
const filmsJsoncFilePath = path.resolve(__dirname, '../inputs/films.jsonc');

/*! 映画情報を JSONC ファイルから取得し Google Sheets に書き込む */
(async () => {
  const functionName = 'Add Films';
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
  
  // JSONC ファイルを読み込む
  let newFilms = null;
  try {
    const filmsJsoncFile = await fs.readFile(filmsJsoncFilePath, 'utf8');
    const rawNewFilms = parseJsonc(filmsJsoncFile);
    if(rawNewFilms == null || rawNewFilms.length === 0) throw new Error('Films Are Empty');
    
    // オブジェクト形式から配列形式に変換する
    newFilms = rawNewFilms.map((rawNewFilm) => [
      String(rawNewFilm.publishedYear ?? '').trim(),
      (      rawNewFilm.title         ?? '').trim(),
      (      rawNewFilm.japaneseTitle ?? '').trim(),
      (      rawNewFilm.scenario      ?? '').trim(),
      (      rawNewFilm.review        ?? '').trim(),
      (      rawNewFilm.casts         ?? '').trim(),
      (      rawNewFilm.staffs        ?? '').trim(),
      (      rawNewFilm.tags          ?? '').trim()
    ]);
  }
  catch(error) {
    logUtils.errorLog(error, 'Failed To Parse Films JSONC File');
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
  
  // シート一覧を取得し、シート名を条件に Sheet ID を取得する。ココで API コールをするので認証失敗時はココでも分かる
  let sheetId = null;
  try {
    const sheetsResult = await sheets.spreadsheets.get({ spreadsheetId: spreadsheetId });
    const targetSheet = sheetsResult.data.sheets.find((sheet) => sheet.properties.title === sheetTitle);
    sheetId = targetSheet.properties.sheetId;
  }
  catch(error) {
    logUtils.errorLog(error, 'Failed To Get Sheet ID');
    return logUtils.finishedLog(functionName);
  }
  
  console.log(`- Spread Sheet ID : ${spreadsheetId}`);
  console.log(`- Sheet Title     : ${sheetTitle}`);
  console.log(`- Sheet ID        : ${sheetId}`);
  console.log(`- Number To Add   : ${newFilms.length}`);
  console.log('');
  
  // `y` を入力すれば開始、`all` を入力すれば1件ずつの確認をせず全件一気に登録する
  const confirmStart = await readText('Start One-By-One? (y) or Start All? (all)');
  let isExecOneByOne = true;
  if(confirmStart === 'all') {
    isExecOneByOne = false;
  }
  else if(confirmStart !== 'y') {
    console.log('Aborted');
    return logUtils.finishedLog(functionName);
  }
  
  // 映画情報を追加していく
  try {
    for(const [index, newFilm] of newFilms.entries()) {
      // 1件ずつ確認しながら実行する際は都度プロンプトを表示する
      if(isExecOneByOne) {
        const confirmOne = await readText(`[${index}] ${newFilm[0]} ${newFilm[1]} ----- Start? (y)`);
        if(confirmOne !== 'y') {
          console.log(`[${index}] ${newFilm[0]} ${newFilm[1]} ----- Skipped`);
          continue;
        }
      }
      // 映画情報を1件追加する
      console.log(`[${index}] ${newFilm[0]} ${newFilm[1]} ----- Start`);
      const addedRowIndex = await addFilm(sheets, sheetId, newFilm);  // Index なので +1 して行番号として一応ログ出力しておく
      console.log(`[${index}] ${newFilm[0]} ${newFilm[1]} ----- Finished [${addedRowIndex + 1}]`);
    }
  }
  catch(error) {
    logUtils.errorLog(error, 'Failed To Add Film');
    return logUtils.finishedLog(functionName);
  }
  
  logUtils.finishedLog(functionName);
})();

/**
 * 映画情報を1件追加する
 * 
 * @param {sheets_v4.Sheets} sheets Google Sheets
 * @param {number} sheetId Sheet ID
 * @param {Array<string>} newFilm 追加する映画情報
 * @return {Promise<number>} 追加した行の添字 (行番号としては +1 した値だが、複数行の追加によって最終的な位置とは異なる可能性がある)
 * @throws API コールに失敗した場合
 */
async function addFilm(sheets, sheetId, newFilm) {
  // 全列のデータを取得する
  const valuesResult = await sheets.spreadsheets.values.get({
    spreadsheetId: spreadsheetId,
    range        : `${sheetTitle}!A:H`  // I 列以降は非公開の列なので取得しない
  });
  // `shift()` によりヘッダの1行を削り映画情報の行のみにする
  const allFilms = valuesResult.data.values;
  allFilms.shift();  // NOTE : 安全のためには `validateHeaderColumns()` を実装しておくべきだがココでは無視
  
  // 追加する行番号を特定する
  const diffFilms = detectRowIndexOfAddingFilm(allFilms, newFilm);
  const addingFilm = diffFilms.find((diffFilm) => diffFilm.beforeRowIndex === -1);  // その他の差分があってもココでは無視
  const targetRowIndex = addingFilm.afterRowIndex + 1;  // 削った見出し行の分だけ足す
  
  // 指定行に空行を入れてデータを書き込む・結果オブジェクトは成功時は見る必要なし
  const _batchUpdateResult = await sheets.spreadsheets.batchUpdate({
    spreadsheetId: spreadsheetId,
    requestBody: {
      requests: [
        { insertDimension: {
            inheritFromBefore: true,  // 罫線などの情報を引き継ぐ
            range: {
              sheetId   : sheetId,            // 操作する Sheet ID
              dimension : 'ROWS',             // 行を追加する
              startIndex: targetRowIndex,     // 追加し始める Index・例えば `3` を指定すると4行目に空行ができる
              endIndex  : targetRowIndex + 1  // 1行追加する
            }
          }
        },
        { updateCells: {
            start: {
              sheetId    : sheetId,
              rowIndex   : targetRowIndex,  // 追加した1行にデータを書き込む
              columnIndex: 0
            },
            fields: 'userEnteredValue',  // 以下の `rows.values[]` 配下で指定する `userEnteredValue` を指定しておく
            rows: [
              {
                values: [  // 文字列を挿入するのクッソだるいなコレ
                  { userEnteredValue: { stringValue: newFilm?.[0] ?? '' } },  // A 列 : Published Year : 公開年
                  { userEnteredValue: { stringValue: newFilm?.[1] ?? '' } },  // B 列 : Title          : 原題
                  { userEnteredValue: { stringValue: newFilm?.[2] ?? '' } },  // C 列 : Japanese Title : 邦題
                  { userEnteredValue: { stringValue: newFilm?.[3] ?? '' } },  // D 列 : Scenario       : あらすじ
                  { userEnteredValue: { stringValue: newFilm?.[4] ?? '' } },  // E 列 : Review         : 感想
                  { userEnteredValue: { stringValue: newFilm?.[5] ?? '' } },  // F 列 : Casts          : キャスト
                  { userEnteredValue: { stringValue: newFilm?.[6] ?? '' } },  // G 列 : Staffs         : スタッフ
                  { userEnteredValue: { stringValue: newFilm?.[7] ?? '' } }   // H 列 : Tags           : タグ
                ]
              }
            ]
          }
        }
      ]
      //includeSpreadsheetInResponse: false      // 戻り値にシートのデータを含めない (デフォルト値)
      //responseRanges              : ['A1:H1']  // `includeSpreadsheetInResponse: true` の場合に取得する範囲を複数指定できる
      //responseIncludeGridData     : false      // `includeSpreadsheetInResponse: true` の場合に Grid データを返さない (デフォルト値)・意味不明なので無視
    }
  });
  return targetRowIndex;
}

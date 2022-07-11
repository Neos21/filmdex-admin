/*! 各種ログ出力用関数 */

/**
 * 開始時のログ出力
 * 
 * @param {string} functionName 機能名
 */
const startLog = (functionName) => {
  console.log(`[${new Date().toISOString()}] ${functionName} : Start\n`);
};

/**
 * 終了時のログ出力
 * 
 * @param {string} functionName 機能名
 */
const finishedLog = (functionName) => {
  console.log(`\n[${new Date().toISOString()}] ${functionName} : Finished`);
};

/**
 * エラーログ出力
 * 
 * @param {Error} error エラーオブジェクト
 * @param {string} message エラーメッセージ
 */
const errorLog = (error, message) => {
  console.error(`${message} ----------`);
  console.error(error);
  console.error(`${message} ----------`);
};

module.exports = {
  startLog,
  finishedLog,
  errorLog
};

/**
 * ユーザ入力を受け付ける
 * 
 * @param {string} message ユーザ入力を促すメッセージ文言
 * @return {Promise<string>} ユーザが入力した文字列 (改行を削除するため `trim()` してある)
 */
const readText = (message = 'Please Input') => {
  process.stdout.write(`${message} > `);
  process.stdin.resume();
  return new Promise((resolve) => process.stdin.once('data', resolve)).finally(() => process.stdin.pause()).then((text) => text.toString().trim());
};

module.exports = readText;

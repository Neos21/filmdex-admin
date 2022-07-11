const jsoncParser = require('jsonc-parser');

/**
 * JSONC をパースする。通常の JSON 仕様に加え、末尾カンマ、コメントを許容する
 * 
 * @param {string} text JSONC 文字列
 * @return {Object} パースされたオブジェクト
 * @throws 空データの場合
 */
const parseJsonc = (text) => jsoncParser.parse(text, null, {
  allowEmptyContent : false,  // 空データを許容しない
  allowTrailingComma: true,   // 末尾カンマを許容する
  disallowComments  : false   // コメントを許容する
});

module.exports = parseJsonc;

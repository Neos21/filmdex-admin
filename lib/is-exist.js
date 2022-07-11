const fs = require('fs').promises;

/**
 * ファイルやディレクトリが存在するか否か判定する
 * 
 * @param {string} targetPath ファイルやディレクトリのパス
 * @return {Promise<boolean>} ファイルやディレクトリが存在すれば `true`・存在しなければ `false`
 */
const isExist = (targetPath) => fs.stat(targetPath).then(() => true).catch(() => false);

module.exports = isExist;

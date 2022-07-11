const fs           = require('fs').promises;
const path         = require('path');
const googleSheets = require('@googleapis/sheets');
const isExist      = require('./is-exist');
const readText     = require('./read-text');

/** Credentials JSON ファイルパス : GCP 上で OAuth2Client を作成しダウンロード・リネームしておく */
const credentialsJsonFilePath = path.resolve(__dirname, '../inputs/credentials.json');
/** Token JSON ファイルパス : このファイルがなければ OAuth2Client がトークン生成してファイルに書き込んでおき、以降はこのファイルに書かれたトークンを利用して動作する */
const tokenJsonFilePath       = path.resolve(__dirname, '../inputs/token.json');
/** スコープ定義 : Google Sheets の読み書きを許可する */
const scope                   = 'https://www.googleapis.com/auth/spreadsheets';

/**
 * OAuth2Client を準備する
 * 
 * - Credentials JSON ファイルを必須とする
 * - Token JSON ファイルがなければ生成を促し利用する・存在すればそのファイルを利用する
 * 
 * @return {Promise<OAuth2Client>} OAuth2Client
 * @throws Credentials JSON ファイルや Token JSON ファイルが読み込めなかった場合、Token 生成に失敗した場合
 */
const setupOAuth2Client = async () => {
  // Credentials JSON ファイルを読み込む
  const credentialsJsonFile = await fs.readFile(credentialsJsonFilePath, 'utf8');
  const credentials = JSON.parse(credentialsJsonFile);
  
  // OAuth2Client を作る
  const oAuth2Client = new googleSheets.auth.OAuth2({
    clientId    : credentials.installed.client_id,
    clientSecret: credentials.installed.client_secret,
    redirectUri : credentials.installed.redirect_uris[0]
  });
  
  // Token を用意する
  let token = null;
  if(await isExist(tokenJsonFilePath)) {
    // Token JSON ファイルがあればそれを読み込む
    const tokenJsonFile = await fs.readFile(tokenJsonFilePath, 'utf8');
    token = JSON.parse(tokenJsonFile);
  }
  else {
    // Token JSON ファイルがなければ初回トークン生成を行わせる
    const authUrl = oAuth2Client.generateAuthUrl({
      access_type: 'offline',
      scope      : scope
    });
    
    console.log(`ブラウザで次の URL にアクセスしてアプリを認証しコードを取得してください : ${authUrl}`);
    // ブラウザで「このアプリは Google で確認されていません」警告が出たら「詳細」→「(アプリ名) (安全ではないページ) に移動」をクリックする
    // 「(アプリ名) が Google アカウントへのアクセスを求めています」画面で「続行」
    // 「このサイトにアクセスできません」になるがその URL からコードを取得する : `http://localhost/?code=【Code】&scope=https://www.googleapis.com/auth/spreadsheets`
    
    const code = await readText('コードを貼り付けてください');
    // 次のように `curl` コマンドを組み立て実行すると JSON が返ってくる・コレと同じ
    // `$ curl -d 'client_id=【Client ID】' -d 'client_secret=【Client Secret】' -d 'redirect_uri=http://localhost' -d 'grant_type=authorization_code' -d 'code=【Code】' 'https://accounts.google.com/o/oauth2/token'`
    
    token = await oAuth2Client.getToken(code);
    
    // Token JSON ファイルに保存する
    await fs.writeFile(tokenJsonFilePath, JSON.stringify(token, null, '  ') + '\n', 'utf8');
  }
  
  // Token を OAuth2Client に設定する
  oAuth2Client.setCredentials(token.tokens);  // NOTE : プロパティが奥まっている点に注意
  
  return oAuth2Client;
};

module.exports = setupOAuth2Client;

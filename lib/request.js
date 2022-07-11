const http  = require('http');
const https = require('https');

/**
 * リクエストする
 * 
 * @param {string} url URL
 * @param {Object} options オプション
 * @return {Promise<string>} レスポンス
 * @throws URL が不正な場合、リクエストエラーが発生した場合、リクエストタイムアウトが発生した場合
 */
const request = (url, options = {}) => new Promise((resolve, reject) => {
  if(!url || typeof url !== 'string') return reject('Invalid URL');
  const agent = url.startsWith('https:') ? https : http;
  const req = agent.request(url, options, (res) => {
    res.setEncoding('utf8');
    let data = '';
    res.on('data', (chunk) => { data += chunk; })
       .on('end' , ()      => { resolve(data); });
  })
    .on('error'  , (error) => { reject(error); })
    .on('timeout', ()      => { req.destroy(); reject('Request Timeout'); });
  req.setTimeout(100000);
  req.end();
});

module.exports = request;

require('dotenv').config();
const logUtils = require('../lib/log-utils');
const readText = require('../lib/read-text');
const request  = require('../lib/request');

/** TMDB (themoviedb.org) の API Key */
const tmdbApiKey = process.env.TMDB_API_KEY;

/*! TMDB API を利用して映画情報を検索する */
(async () => {
  const functionName = 'Search Films';
  logUtils.startLog(functionName);
  
  // TMDB API Key を確認する
  if(tmdbApiKey == null || tmdbApiKey === '') {
    console.error('TMDB API Key Is Empty. Please Set Environment Variable "TMDB_API_KEY"');
    return logUtils.finishedLog(functionName);
  }
  
  // 第1引数で指定があればその値を使用する・そうでなければ入力プロンプトを表示する
  let searchText = String(process.argv[2] ?? '').trim();
  if(searchText !== '') {
    searchText = process.argv.slice(2).join(' ').trim();
  }
  else {
    searchText = await readText('Please Input Search Text');  // Trim 済
    console.log('');
    if(searchText === '') {
      console.error('Search Text Is Empty');
      return logUtils.finishedLog(functionName);
    }
  }
  
  // リクエストする
  let responseText = '';
  try {
    const apiUrl = `https://api.themoviedb.org/3/search/movie?api_key=${tmdbApiKey}&language=ja&query=${searchText}`;
    console.log(`- TMDB_API_KEY : ${tmdbApiKey}`);
    console.log(`- Search Text  : ${searchText}`);
    console.log(`- API URL      : ${apiUrl}`);
    console.log('');
    responseText = await request(apiUrl);
  }
  catch(error) {
    logUtils.errorLog(error, 'Request Error Has Occurred');
    return logUtils.finishedLog(functionName);
  }
  
  // JSON パースする
  let json = null;
  try {
    json = JSON.parse(responseText);
  }
  catch(error) {
    logUtils.errorLog(error, 'Failed To Parse JSON');
    return logUtils.finishedLog(functionName);
  }
  
  // TMDB API Key の誤りなどで API コールが失敗している場合
  if(json.success === false) {
    console.error(`Invalid API Call : ${json.status_message}`);
    return logUtils.finishedLog(functionName);
  }
  
  // 結果が0件の場合
  if(json.results == null || json.results.length === 0) {
    console.log('Seach Results Not Found');
    return logUtils.finishedLog(functionName);
  }
  
  // 結果出力 : 最大で一度に20件取得できるが上位5件に絞る・Film クラス相当のプロパティに移し替える
  const resultFilms = json.results.slice(0, 5).map((result) => ({
    publishedYear: Number(result.release_date.slice(0, 4)),
    title        : result.original_title.replace((/^The /u), '').replace((/　/gu), ' '),
    japaneseTitle: result.title         .replace((/^The /u), '').replace((/　/gu), ' '),
    scenario     : result.overview,
  }));
  console.log(`Results : [${resultFilms.length}] ----------`);
  console.log('');
  // コピペで利用しやすいように整形して出力する
  resultFilms.forEach((resultFilm) => console.log(`  {
    "publishedYear": ${resultFilm.publishedYear},
    "title"        : "${resultFilm.title        .replace((/"/gu), '\\"')}",
    "japaneseTitle": "${resultFilm.japaneseTitle.replace((/"/gu), '\\"')}",
    "scenario"     : "${resultFilm.scenario     .replace((/"/gu), '\\"')}",
    "review"       : "",
    "casts"        : "",
    "staffs"       : "",
    "tags"         : ""
  },`));
  console.log('');
  console.log(`Results : [${resultFilms.length}] ----------`);
  
  logUtils.finishedLog(functionName);
})();

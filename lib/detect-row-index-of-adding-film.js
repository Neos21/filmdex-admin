/**
 * 映画情報を1件追加するための行番号を特定する
 * 
 * @param {Array<Array<string>>} allFilms Google Sheets API で取得した映画情報の二次元配列・子の配列が1行の各列データを表す
 * @param {Array<string>} newFilm 追加する映画情報
 * @return {Array<Object>} 引数 `allFilms` に引数 `newFilm` を追加した後、ソートして行番号がズレた映画情報を返す
 *                         `rawValues` プロパティに行データの配列が格納されている
 *                         `beforeRowIndex` プロパティが `-1` のデータが、追加された引数 `newFilm` に該当する
 *                         `afterRowIndex` プロパティが、実際にシートに行追加する際の添字となる
 *                         追加する映画情報と、その行追加により1行ズレたデータ以外にも、元の並び順から差が出たデータも抽出している
 */
const detectRowIndexOfAddingFilm = (allFilms, newFilm) => {
  // 操作前の行番号を控える
  const addingFilms = allFilms.map((film, rowIndex) => ({
    rawValues     : film,
    beforeRowIndex: rowIndex
  }));
  
  // 登録したい映画情報を末尾に追加する
  addingFilms.push({
    rawValues     : newFilm,
    beforeRowIndex: -1  // 存在しなかった行には `-1` を入れておく
  });
  
  // ソートする : このソート処理は FilmDeX プロジェクト内の `fetch-filmdex.js` にあるソート処理と同じ
  addingFilms.sort((filmA, filmB) => {
    // 先に「公開年」の昇順でソートする
    if(filmA.rawValues[0] > filmB.rawValues[0]) return  1;
    if(filmA.rawValues[0] < filmB.rawValues[0]) return -1;
    // 「公開年」が同一の場合、「原題」の昇順でソートする (邦画の場合はひらがな表記を期待しているのでひらがなでソートされる)
    if(filmA.rawValues[1] > filmB.rawValues[1]) return  1;
    if(filmA.rawValues[1] < filmB.rawValues[1]) return -1;
    // 同一値なら 0 を返す
    return 0;
  });
  
  // 操作後の行番号を控える
  const afterFilms = addingFilms.map((addingFilm, rowIndex) => ({
    rawValues     : addingFilm.rawValues,
    beforeRowIndex: addingFilm.beforeRowIndex,
    afterRowIndex : rowIndex
  }));
  
  // 行番号がズレたデータをあぶり出す
  const diffFilms = afterFilms.filter((afterFilm) => {
    if(afterFilm.beforeRowIndex     === -1                     ) return true ;  // 挿入した行は必ず抽出する
    if(afterFilm.beforeRowIndex     === afterFilm.afterRowIndex) return false;  // 変化がない行は除外する
    if(afterFilm.beforeRowIndex + 1 === afterFilm.afterRowIndex) return false;  // 1行のズレは行追加後の後続行とみなして除外する
    return true;  // その他の差分は抽出する (手作業での書き込み時に挿入位置を間違えたモノなど)
  });
  return diffFilms;
};

module.exports = detectRowIndexOfAddingFilm;

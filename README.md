# FilmDeX Admin

[FilmDeX](https://github.com/Neos21/filmdex) を管理するためのツール集。


## `$ npm run search`

[TMDB](https://www.themoviedb.org/?language=ja) API を利用して映画情報を検索する。API Key は TMDB にアカウント登録することで発行できるので、環境変数ファイル `.env` に定義しておく。

検索結果はコンソール出力のみ。適宜手動で `inputs/films.jsonc` にコピペし加筆修正する。


## `$ npm run add`

FilmDeX の Google Sheets に複数の映画情報を一括登録する。以下の手順で `inputs/credentials.json` と `inputs/token.json` を用意し、Google Sheets 情報を `.env` ファイルに定義しておく。`inputs/films.jsonc` に書かれた映画情報を一括登録する。

### Google Sheets API を利用するための OAuth2 Client の作成手順

1. GCP コンソール → プロジェクトを選択する → API とサービス → 左メニュー「有効な API とサービス」に進む
2. 上部の「+ API とサービスの有効化」ボタン → 検索して「Google Sheets API」を有効にする
3. 再び「有効な API とサービス → リストから「Google Sheets API」を選択 → 「認証情報」タブ → 右上「+ 認証情報を作成」ボタン → プルダウン「OAuth クライアント ID」
4. 「OAuth クライアント ID の作成」画面
    - アプリケーションの種類 : デスクトップ アプリ
    - 名前 : 任意
5. Client ID、Client Secret が発行される。その画面で `inputs/credentials.json` に相当する JSON ファイル (`client_secret_xxx.json`) がダウンロードできる

スクリプトの初回実行時、ブラウザアクセスで認証コードを発行し、その認証コードをプロンプトに貼り付けることで Access Token を発行し `inputs/token.json` ファイルに控えておく流れになる。


## `$ npm run get`

FilmDeX の Google Sheets の内容を取得する。上述の `npm run add` 内の処理の一部を流用している。

取得したファイルは `outputs/filmdex.json` に出力される。


## Links

- [Neo's World](https://neos21.net/)

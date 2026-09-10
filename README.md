# Interaction Archive

複数のWebインタラクション作品を、1つのトップページから見せるための静的サイトです。

## ファイル構成

```text
interaction-gallery-site/
├── index.html                       # 作品一覧ページ
├── assets/
│   └── style.css                    # 一覧ページの見た目
└── works/
    ├── water-cursor/
    │   └── index.html               # 水面カーソル作品
    └── _template/
        └── index.html               # 次の作品用ひな型
```

## ローカルで確認

`index.html`をダブルクリックしてブラウザで開きます。

## 次の作品を追加する

1. `works/_template`フォルダを複製する
2. 複製したフォルダ名を、英小文字とハイフンで変更する（例：`particle-trail`）
3. そのフォルダ内の`index.html`を編集する
4. トップの`index.html`で、`Water Cursor`の`<a class="work-card ...">...</a>`全体を複製する
5. リンクを `./works/particle-trail/` に変更し、タイトル・説明・番号を変更する

## GitHub Pagesで公開

リポジトリの一番上に、このフォルダの中身をそのまま置きます。
その後、Repository Settings → Pages → Deploy from a branch → `main` / `/(root)` を選択します。

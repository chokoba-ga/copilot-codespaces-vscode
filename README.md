# Event POS - 学校イベント専用 会計アプリ

工業祭・文化祭・体育祭・地域イベントなど、学校のあらゆる行事で使い回せる
POSレジ・会計管理アプリです。React + TypeScript + Supabase + Netlify で作られています。

**アカウント登録・ログインは不要**です（誰でもURLを開くだけで使えます）。
**二段階認証(2FA)も不要**です。

---

## 1. Supabaseプロジェクトを作る

1. https://supabase.com/ を開き、「Start your project」→ GitHubまたはメールで登録
2. 「New project」→ プロジェクト名を決め、リージョンは `Northeast Asia (Tokyo)` を選択
3. 「Create new project」をクリックし、数分待つ

## 2. データベースを準備する

1. 左メニュー「SQL Editor」→「New query」
2. `supabase/schema.sql` の中身を全部コピーして貼り付け、「Run」
3. これでテーブル・権限（RLS）・会計処理の関数がすべて作られます

## 3. ログイン不要にするための設定

1. 左メニュー「Authentication」→「Sign In / Providers」
2. 「Anonymous Sign-Ins」欄の「Allow anonymous sign-ins」を **オン** にする
3. 「Save」

これで、誰でもアカウント登録なしにアプリを開けます。開いた人は最初に
「名前だけ」を聞かれ、以降その名前が会計記録の「担当者」として使われます。

> **セキュリティについて：** ログインが無い分、URLを知っている人は誰でも
> 全操作ができます。文化祭当日はURLをレジ担当者だけに共有してください。

## 4. APIキーを確認する

1. 左メニュー「Project Settings」（歯車）→「API Keys」
2. 「Project URL」と「Publishable key」（`sb_publishable_...`）をメモする

## 5. 自動一時停止を防ぐ（推奨）

Supabase無料プランは7日間操作がないと自動的に一時停止します。
`supabase/keep-alive-heartbeat.sql` を実行しておくと、毎日自動で
軽いアクセスが発生し、一時停止を防げます。

1. 「Database」→「Extensions」で `pg_cron` を検索してオンにする
2. 「SQL Editor」で `supabase/keep-alive-heartbeat.sql` の中身を実行

## 6. Netlifyで公開する

### 方法A：GitHub経由
1. プロジェクトをGitHubにアップロード
2. https://app.netlify.com/ →「Add new site」→「Import an existing project」
3. リポジトリを選択（ビルド設定は `netlify.toml` 済み）
4. デプロイ前に「7. 環境変数を設定する」を先に行う

### 方法B：フォルダを直接アップロード
1. `npm install` → `npm run build`
2. https://app.netlify.com/drop に `dist` フォルダをドラッグ＆ドロップ
3. この方法では、ビルド前にローカルの `.env` に環境変数を設定しておく

## 7. 環境変数を設定する

`.env.example` をコピーして `.env` を作成し、手順4の値を入力：

```
VITE_SUPABASE_URL=https://xxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_xxxxxxxxxxxxxxxxxxxxxxxx
```

Netlify「方法A」の場合は、Netlifyの「Site configuration」→
「Environment variables」にも同じ内容を登録してください。

---

## 使い方

- **はじめて開く人**：URLを開くと自動接続され、名前（ニックネーム可）を
  聞かれます。事前に「設定」タブでよく使う名前を登録しておくと、
  次回からタップするだけで名乗れます。
- **レジ担当**：日程タブで対象の日を選び（当日以外は選べません。過去の日を
  選ぶ場合のみ確認が出ます）、商品をタップ→「会計へ」→お預かり金額の
  ボタンをタップして加算（間違えたら「戻る」で1回分取消）→「会計を確定する」。
- **試食・ロス**：レジ画面上の「ロス・試食」ボタンから登録（売上には計上されません）。
- **間違えた会計**：「履歴」タブから該当の会計を探し「取消する」。
- **行事が終わったら**：「設定」タブ →「学校提出用PDFを作成する」。

## 日程・日付についての仕様

- レジ画面では、開催日の日付が来ていない日（例：翌日の2日目）はまだ選べません
- 1日目の日付が過ぎると、レジ画面は自動的に2日目を選んだ状態になります
- 過去の日（例：2日目に、1日目の会計を追加したい場合）を選ぶと、
  「これは過去の会計です」という確認が出ます
- ダッシュボード・履歴・PDF画面は、日付にかかわらずいつでも自由に
  好きな日程を選んで見られます（レジ画面だけ日付を制限しています）

## 補助費・初期資金について

「設定」タブのイベント設定に「補助費・初期資金」を入力すると、
ダッシュボードとPDFに「手元資金の目安（補助費 + 売上 − 支出）」が
追加で表示されます。学校から先にもらった活動費がある場合に使ってください。

---

## 技術スタック

React 19 / TypeScript / Vite / Tailwind CSS v4 / Supabase
（PostgreSQL・匿名認証・Realtime・Row Level Security）/ Zustand /
React Router / Chart.js / jsPDF + jspdf-autotable（日本語フォント埋め込み）/
vite-plugin-pwa / Netlify

## ローカルでの開発

```bash
npm install
cp .env.example .env
npm run dev
```

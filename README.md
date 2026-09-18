# ネシクル(仮) β版

LINEミニアプリを起点とした紹介マーケティングサービスのβ版一式です。以下を含みます。

- `apps/liff` — LINEミニアプリ(紹介者 / 紹介された方の両方の画面)
- `apps/admin` — 運営管理者向けWeb管理画面
- `apps/api` — バックエンドAPI (Fastify + TypeScript)
- `packages/db` — Prismaスキーマ・マイグレーション・シードデータ
- `packages/shared` — フロント/バックエンドで共有する型・enum・日本語ラベル

## 前提

- Node.js 20+ / npm 10+
- Docker Desktop (ローカルPostgreSQLの起動に使用)

## セットアップ

```bash
docker compose up -d          # PostgreSQLを起動
npm install                   # 全ワークスペースの依存関係をインストール
npm run db:migrate            # マイグレーション実行 (初回は `-- --name init` 済み)
npm run db:seed               # サンプルデータ投入
npm run dev                   # api(:4000) / liff(:3000) / admin(:3011) を同時起動
```

個別に起動する場合は `npm run dev -w apps/api` のように `-w` でワークスペースを指定します。

## 環境変数

ルートの `.env.example` が全体のリファレンスです。実行時は以下のファイルを参照します(すでに開発用の値で作成済みです)。

| ファイル | 用途 |
| --- | --- |
| `packages/db/.env` | Prisma CLI (`migrate`/`seed`) 用の `DATABASE_URL` |
| `apps/api/.env` | APIサーバー本体の設定一式 |
| `apps/liff/.env.local` | LIFFアプリ向け (`NEXT_PUBLIC_API_BASE_URL`, `NEXT_PUBLIC_LIFF_ID`) |
| `apps/admin/.env.local` | 管理画面向け (`NEXT_PUBLIC_API_BASE_URL`) |

`DATABASE_URL` や JWTシークレットを変更する場合は、上記ファイルすべてで値を揃えてください。

## ログイン情報 (シード投入後)

- **管理画面** (`http://localhost:3011`): `admin@nesicle.jp` / `ChangeMe123!`
- **LINEミニアプリ**: `NEXT_PUBLIC_LIFF_ID` が未設定の場合、ログイン画面に「開発用ログイン」が表示されます。「デモ紹介者としてログイン」を押すとサンプル実績入りの紹介者(宮本さくら)としてログインできます。

## LINEログインの本番切り替え

現状はLIFFチャンネルが未発行のため、`ALLOW_DEV_LOGIN=true` の開発用ログインで代替しています。本番のLIFFチャンネルを発行したら:

1. `apps/liff/.env.local` の `NEXT_PUBLIC_LIFF_ID` に発行されたLIFF IDを設定
2. `apps/api/.env` の `LINE_LOGIN_CHANNEL_ID` にLINEログインチャンネルIDを設定
3. `apps/api/.env` の `ALLOW_DEV_LOGIN` を `false` に変更

これにより `apps/liff` は自動的に実際のLINEログイン(`liff.login()` → `POST /api/auth/liff-login`)を使うようになります。コード変更は不要です。

## β版スコープ外(今回未実装)

要件定義書のセクション10の通り、以下は対象外です: 掲載企業専用/法人管理画面、掲載企業が直接成果を登録する機能、Salesforce等の外部連携、複雑な請求管理、自動振込、高度な通知/自動化。

なお、要件定義書セクション8の「ネシクル紹介用Webサイト」は依頼により本リポジトリの対象外としています(LINEミニアプリ + 管理画面 + バックエンドのみ)。

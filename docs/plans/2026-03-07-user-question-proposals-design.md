# ユーザーによる出題案の申請機能 設計書

GitHub Issue: #24

## 概要

一般ユーザーが出題案（QuestionProposal）を作成・編集・申請できる機能を追加する。管理者がレビューして承認/却下する既存フローはそのまま活用する。

## アプローチ

ユーザー向け専用 API ルート（`/api/user-proposals`）を新設し、既存の管理者向けルート（`/api/question-proposals`）とは分離する。ユースケース層は共通で使い回す。

## バックエンド API

### ユーザー向け API（`/api/user-proposals`）

`requireAuth` で保護。全操作で `c.get("user").id` を使い、自分の出題案のみに制限する。

| メソッド | パス          | 説明                                      |
| -------- | ------------- | ----------------------------------------- |
| GET      | `/`           | 自分の出題案一覧（userId で自動フィルタ） |
| GET      | `/:id`        | 自分の出題案詳細（所有者チェック）        |
| POST     | `/`           | 出題案を新規作成（userId を自動セット）   |
| PUT      | `/:id`        | 出題案を編集（pending/rejected のみ）     |
| POST     | `/:id/submit` | 出題案を申請（pending → reviewed）        |

### 既存管理者 API の変更

- `CreateQuestionProposal` ユースケースに `userId` パラメータを追加（オプション）
- 管理者向けの一覧/詳細レスポンスにユーザー情報（名前）を追加

### 認可

- ユーザー向けルートは `requireAuth` のみ（`requireAdmin` 不要）
- 全操作で所有者チェック（自分の出題案以外は 403）
- 管理者向けルートは既存の `requireAdmin` のまま

## フロントエンド

### ルーティング

| パス             | ページ             | 説明                               |
| ---------------- | ------------------ | ---------------------------------- |
| `/proposals`     | ProposalListPage   | 自分の出題案一覧                   |
| `/proposals/new` | ProposalNewPage    | 出題案作成                         |
| `/proposals/:id` | ProposalDetailPage | 出題案詳細（編集・申請・状態確認） |

全て `AppLayout` 内の `ProtectedRoute` 配下に配置。

### ナビゲーション

`AppLayout` のサイドバー/ナビに「出題案」メニューを追加。

### 画面構成

**一覧ページ (`/proposals`)**

- 自分の出題案をステータスバッジ付きで表示
- 「新規作成」ボタン
- ステータスでフィルタ可能

**作成ページ (`/proposals/new`)**

- 管理者向けの `proposal-edit-form.tsx` を共通コンポーネントとして切り出して再利用
- カテゴリ選択、問題文、難易度、選択肢、正解、解説の入力フォーム

**詳細ページ (`/proposals/:id`)**

- 出題案の内容を表示
- ステータスに応じたアクションボタン:
  - `pending`: 「編集」「申請する」
  - `rejected`: 却下理由の表示 + 「編集して再申請」
  - `reviewed`: 「レビュー待ち」表示（操作なし）
  - `approved` / `withdrawn`: 状態表示のみ

### 管理者画面の変更

- 出題案一覧・詳細に提案者のユーザー名を表示（`userId` が null なら「管理者」と表示）

## データ層

### DB スキーマ

変更不要。既存の `questionProposalProjections.userId` と `questionProposalEvents` の payload で対応可能。

### Projection Query の変更

管理者向けの一覧・詳細で `user` テーブルを LEFT JOIN してユーザー名を取得する。レスポンスに `userName: string | null` を追加。

### ユーザー向け Query

`QuestionProposalProjectionQueryService` に `findByUserId(userId, status?, limit, offset)` メソッドを追加。

### ユースケースの変更

- `CreateQuestionProposal`: `userId` パラメータを受け取り `QuestionProposal.create()` に渡す
- `UpdateQuestionProposal`, `SubmitQuestionProposal` はそのまま流用。所有者チェックはルートハンドラ側で実施

## ステータスフロー（ユーザー視点）

```
pending（下書き）→ [submit] → reviewed（レビュー待ち）→ 管理者が approve/reject
                                                          ↓ reject
                                                     rejected → [edit] → pending（再編集）→ [submit] → reviewed
```

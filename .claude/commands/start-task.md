GitHub issue #$ARGUMENTS の作業を開始する。git worktree を使って作業環境を作成する。

引数のフォーマット: `<issue番号> [ベースブランチ]`

- 第1引数: issue 番号（必須）例: `42`
- 第2引数: ベースブランチ（省略可、デフォルト: `main`）例: `feature/some-feature`

## 手順

1. 引数を解析する:
   - 第1引数を issue 番号として取得
   - 第2引数があればベースブランチとして使用、なければ `main` を使用

2. GitHub から issue 情報を取得する:
   - `gh issue view <番号>` で issue の詳細を取得
   - タイトルと説明を確認

3. ブランチ名を決定する:
   - フォーマット: `feature/<issue番号>-<簡潔な説明>`
   - issue タイトルから適切な説明を生成（英語、ケバブケース）

4. git worktree を作成する:
   - パス: `../chem-drill-<issue番号>`（リポジトリの親ディレクトリに作成）
   - `git fetch origin <ベースブランチ>` で最新を取得
   - `git worktree add <path> -b <branch-name> origin/<ベースブランチ>`

5. 環境ファイルをコピーする（.gitignore されているため）:
   - `cp apps/api/.env <worktree>/apps/api/`
   - `cp apps/web/.env <worktree>/apps/web/`
   - `cp -r .claude <worktree>/`

6. worktree ディレクトリで依存をインストールする:
   - `pnpm install --dir <worktree>`

7. 作成結果を表示する:
   - worktree のパス
   - ブランチ名
   - issue のタイトルと概要

8. 最後に worktree へ移動するための cd コマンドを出力する:
   - **絶対パス**で出力すること（`pwd`で取得した親ディレクトリを使用）
   - 見やすいように強調表示する
   ```bash
   cd /absolute/path/to/worktree
   ```

## 注意事項

- worktree は親ディレクトリに作成する
- ブランチはベースブランチ（デフォルト: main）から派生させる
- 既に同名のブランチや worktree が存在する場合はエラーを報告

## 出力フォーマット

最後の cd コマンドは以下のように出力する:

```bash
cd /absolute/path/to/chem-drill-<issue番号>
```

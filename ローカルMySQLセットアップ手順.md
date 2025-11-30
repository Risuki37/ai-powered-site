# ローカルMySQLセットアップ手順

## 📋 概要

開発環境でローカルMySQLを使用するためのセットアップ手順です。

---

## ✅ 前提条件

- MySQLがインストールされていること（確認済み: Ver 8.0.21）

---

## 🚀 セットアップ手順

### ステップ1: MySQLサーバーの起動

```bash
# Homebrewでインストールした場合
brew services start mysql

# または、手動で起動
mysql.server start
```

**確認方法**:
```bash
# MySQLサービスが起動しているか確認
brew services list | grep mysql

# または
ps aux | grep mysql
```

---

### ステップ2: データベースとユーザーの作成

MySQLに接続：
```bash
mysql -u root -p
```

パスワードを入力後、以下を実行：

```sql
-- データベースを作成
CREATE DATABASE IF NOT EXISTS ai_powered_site_dev 
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- ユーザーを作成
CREATE USER IF NOT EXISTS 'dev_user'@'localhost' IDENTIFIED BY 'dev_password';

-- 権限を付与
GRANT ALL PRIVILEGES ON ai_powered_site_dev.* TO 'dev_user'@'localhost';
FLUSH PRIVILEGES;

-- 確認
SHOW DATABASES;
SELECT User, Host FROM mysql.user WHERE User = 'dev_user';
EXIT;
```

---

### ステップ3: 環境変数の設定

`.env.local`ファイルを編集して、以下を設定：

```env
DATABASE_URL="mysql://dev_user:dev_password@localhost:3306/ai_powered_site_dev?schema=public"
```

---

### ステップ4: 接続確認

```bash
# 接続テスト
mysql -u dev_user -pdev_password ai_powered_site_dev

# 接続できたら以下を実行
SHOW TABLES;
EXIT;
```

---

### ステップ5: Prismaマイグレーション

```bash
cd code

# マイグレーションファイルを作成・実行
npm run db:migrate

# または、開発中のみスキーマを同期する場合
npx prisma db push
```

**期待される結果**:
- 11個のテーブルが作成される
- マイグレーションファイルが`prisma/migrations/`ディレクトリに作成される

---

### ステップ6: データベースの確認

Prisma Studioを使用してデータベースの状態を確認：

```bash
npx prisma studio
```

ブラウザで `http://localhost:5555` が開き、データベースの内容を確認できます。

---

## 🔧 トラブルシューティング

### MySQLサーバーが起動しない

**解決方法**:
```bash
# MySQLのログを確認
tail -f /usr/local/var/mysql/*.err

# MySQLを再起動
brew services restart mysql
```

### データベース接続エラー

**エラーメッセージ**: `Access denied for user 'dev_user'@'localhost'`

**解決方法**:
1. ユーザーが正しく作成されているか確認
   ```sql
   SELECT User, Host FROM mysql.user WHERE User = 'dev_user';
   ```

2. 権限を再付与
   ```sql
   GRANT ALL PRIVILEGES ON ai_powered_site_dev.* TO 'dev_user'@'localhost';
   FLUSH PRIVILEGES;
   ```

### データベースが存在しないエラー

**解決方法**:
```sql
-- データベースが存在するか確認
SHOW DATABASES;

-- 存在しない場合は作成
CREATE DATABASE ai_powered_site_dev 
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

---

## 📝 データベース接続情報まとめ

**開発環境用**:
```
データベース名: ai_powered_site_dev
ユーザー名: dev_user
パスワード: dev_password
ホスト: localhost
ポート: 3306
```

**接続文字列**:
```
mysql://dev_user:dev_password@localhost:3306/ai_powered_site_dev?schema=public
```

---

## 🎯 次のステップ

MySQLのセットアップが完了したら：

1. **`.env.local`に`DATABASE_URL`を設定**
2. **Prismaマイグレーションを実行**
3. **開発サーバーを起動して動作確認**

詳細は[開発環境セットアップ完了チェックリスト](./開発環境セットアップ完了チェックリスト.md)を参照してください。

---

**最終更新**: 2025-11-29


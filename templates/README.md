# テンプレートの追加

このフォルダに画像を置き、ルートの `templates.js` に1件追加するとテンプレートとして表示されます。

```js
{
  "id": "my-template",
  "title": "MY<br>DESIGN",
  "name": "マイテンプレート",
  "description": "用途の説明",
  "image": "templates/my-template.webp"
}
```

`image` は省略できます。省略時は既存のグラデーションプレビューを使います。画像を使う場合は `templates/` からの相対パスを指定してください。

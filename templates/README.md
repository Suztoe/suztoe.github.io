# テンプレートの追加

このフォルダに画像を置き、`manifest.json` に1件追加するとテンプレートとして表示されます。

```json
{
  "id": "my-template",
  "title": "MY<br>DESIGN",
  "name": "マイテンプレート",
  "description": "用途の説明",
  "image": "templates/my-template.webp"
}
```

`image` は省略できます。省略時は既存のグラデーションプレビューを使います。

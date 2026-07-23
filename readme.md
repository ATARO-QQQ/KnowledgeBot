
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Knowledge Bot - README</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" rel="stylesheet">
    <style>
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, "Helvetica Neue", Arial, "Hiragino Kaku Gothic ProN", "Hiragino Sans", "Meiryo", sans-serif;
            background-color: #F4F4F5; 
            color: #111111;
        }

        
        * {
            border-radius: 0 !important;
        }

        
        ::-webkit-scrollbar { width: 8px; }
        ::-webkit-scrollbar-track { background: #FFFFFF; border-left: 1px solid #000000; }
        ::-webkit-scrollbar-thumb { background: #000000; }
        
        .markdown-body h2 {
            font-size: 1.5rem;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.1em;
            border-bottom: 2px solid #000000;
            padding-bottom: 0.5rem;
            margin-top: 2.5rem;
            margin-bottom: 1rem;
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }

        .markdown-body h3 {
            font-size: 1.125rem;
            font-weight: 700;
            margin-top: 1.5rem;
            margin-bottom: 0.5rem;
        }

        .markdown-body p {
            margin-bottom: 1rem;
            line-height: 1.7;
            font-size: 0.95rem;
        }

        .markdown-body ul, .markdown-body ol {
            margin-bottom: 1rem;
            padding-left: 1.5rem;
            line-height: 1.7;
            font-size: 0.95rem;
        }

        .markdown-body ul {
            list-style-type: square;
        }

        .markdown-body ol {
            list-style-type: decimal;
        }

        .markdown-body li {
            margin-bottom: 0.25rem;
        }

        .markdown-body strong {
            font-weight: 700;
            background-color: #000000;
            color: #FFFFFF;
            padding: 0 0.25rem;
        }

        .markdown-body code {
            font-family: monospace;
            background-color: #F4F4F5;
            border: 1px solid #000000;
            padding: 0.1rem 0.3rem;
            font-size: 0.9em;
        }

        .markdown-body pre {
            background-color: #000000;
            color: #FFFFFF;
            padding: 1rem;
            overflow-x: auto;
            margin-bottom: 1rem;
            font-family: monospace;
            font-size: 0.9em;
            box-shadow: 4px 4px 0px 0px rgba(150,150,150,1);
        }
    </style>
</head>
<body class="p-4 md:p-8">

    <div class="max-w-4xl mx-auto bg-white border-2 border-black p-6 md:p-12 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
        
        
        <header class="text-center border-b-4 border-black pb-8 mb-8">
            <i class="fas fa-robot text-5xl mb-4"></i>
            <h1 class="text-4xl md:text-5xl font-extrabold tracking-widest uppercase mb-2">Knowledge Bot</h1>
            <p class="text-gray-600 font-bold tracking-widest uppercase text-sm">独自アルゴリズム搭載 ナレッジチャットシステム</p>
        </header>

        
        <main class="markdown-body">
            
            <p>
                このソフトウェアは、ユーザーがアップロードしたテキストデータと、インターネット上のオープンな情報（Wikipedia等）を組み合わせて、質問に対する回答を自動的に抽出・生成するチャットボットシステムです。<br>
                外部のAI API（OpenAIなど）に依存せず、ブラウザ上で動作する独自の検索・抽出アルゴリズムを採用しています。
            </p>

            <h2><i class="fas fa-star"></i> Features (主な機能)</h2>
            <ul>
                <li><strong>完全ログイン式</strong>: Firebase Authenticationを利用した安全なアクセス管理。</li>
                <li><strong>クラウドデータ保存</strong>: アップロードした資料はFirestoreに保存され、ログインすればいつでもどこでも参照可能です。</li>
                <li><strong>多様なテキスト形式に対応</strong>: <code>.txt</code>, <code>.md</code>, <code>.json</code>, <code>.html</code> ファイルを読み込み、テキストデータを抽出します。</li>
                <li><strong>ハイブリッド検索エンジン</strong>:
                    <ul>
                        <li><strong>ローカル検索</strong>: 保存されたドキュメント内から、質問のキーワードに関連する文章をスコアリングして抽出します。</li>
                        <li><strong>Web検索</strong>: Wikipedia APIを利用し、インターネット上の一般的な知識を補完します。</li>
                    </ul>
                </li>
                <li><strong>ソリッドなモノトーンUI</strong>: 視認性を重視し、無駄な装飾を削ぎ落としたシャープなデザイン。</li>
            </ul>

            <h2><i class="fas fa-book"></i> How to Use (使い方)</h2>
            
            <h3>1. アカウント登録 / ログイン</h3>
            <p>
                初回利用時は、画面の「新規登録」ボタンからメールアドレスとパスワードを入力してアカウントを作成してください。作成後はその情報でログインできます。
            </p>

            <h3>2. データのアップロード</h3>
            <p>
                ログイン後、画面左側（スマートフォンでは上部）のメニューにある「ファイルを選択」ボタンをクリックし、読み込ませたいテキストファイルを選択します。<br>
                ファイルが読み込まれると、下部の「読み込み済みデータ」リストに追加されます。
            </p>

            <h3>3. チャットで質問する</h3>
            <p>
                画面下部の入力欄に質問を入力し、送信ボタン（またはEnterキー）を押します。<br>
                システムが以下の順序で処理を行います：
            </p>
            <ol>
                <li>質問文から重要と思われる「キーワード」を抽出。</li>
                <li>アップロードされたファイル群から、キーワードを含む文章を検索。</li>
                <li>Wikipediaからキーワードに関する概要を検索。</li>
                <li>取得した情報をまとめて提示します。</li>
            </ol>

            <h2><i class="fas fa-cog"></i> Setup (セットアップと注意点)</h2>
            <p>
                本システムを正しく動作させるためには、Firebaseプロジェクト側のセキュリティルールを設定する必要があります。
            </p>

            <h3>Firestore セキュリティルールの設定</h3>
            <p>
                Firebase Consoleにアクセスし、「Firestore Database」 > 「ルール」タブを開き、以下のコードに書き換えて公開（Publish）してください。
            </p>
<pre><code>rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    
    match /users/{userId}/{document=**} {
      
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}</code></pre>
            <p>
                ※この設定を行わないと、データの保存および読み込み時にエラーが発生します。
            </p>

            <h2><i class="fas fa-laptop-code"></i> Technical Stack (技術仕様)</h2>
            <ul>
                <li><strong>フロントエンド</strong>: HTML5, JavaScript (ES Modules), Tailwind CSS, FontAwesome</li>
                <li><strong>バックエンド/BaaS</strong>: Firebase (Authentication, Firestore)</li>
                <li><strong>アルゴリズム</strong>: 簡易形態素解析（ストップワード除去＋正規表現抽出）、キーワードスコアリングによる文抽出</li>
                <li><strong>外部API</strong>: MediaWiki API (Wikipedia)</li>
            </ul>

        </main>

        <footer class="mt-12 pt-6 border-t-2 border-black text-center text-xs font-bold uppercase tracking-widest">
            &copy; 2026 Knowledge Bot System. All rights reserved.
        </footer>
    </div>

</body>
</html>

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-app.js";
        import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js";
        import { getFirestore, collection, addDoc, getDocs, doc, setDoc, query, orderBy, serverTimestamp, onSnapshot, limit } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";

        
        const firebaseConfig = {
            apiKey: "AIzaSyAYatcV4UyTrn4_Wf2HVzdIwM97buXGxLA",
            authDomain: "agenthtml-5f5fb.firebaseapp.com",
            projectId: "agenthtml-5f5fb",
            storageBucket: "agenthtml-5f5fb.firebasestorage.app",
            messagingSenderId: "880525619742",
            appId: "1:880525619742:web:fd6cb57926abb4f5ddb40f",
            measurementId: "G-L8906M810M"
        };

        
        const app = initializeApp(firebaseConfig);
        const auth = getAuth(app);
        const db = getFirestore(app);

        
        const authScreen = document.getElementById('auth-screen');
        const mainScreen = document.getElementById('main-screen');
        const emailInput = document.getElementById('email');
        const passwordInput = document.getElementById('password');
        const authError = document.getElementById('auth-error');
        const loginBtn = document.getElementById('login-btn');
        const signupBtn = document.getElementById('signup-btn');
        const logoutBtn = document.getElementById('logout-btn');
        const newChatBtn = document.getElementById('new-chat-btn');
        const threadList = document.getElementById('thread-list');
        const fileUpload = document.getElementById('file-upload');
        const documentList = document.getElementById('document-list');
        const chatForm = document.getElementById('chat-form');
        const chatInput = document.getElementById('chat-input');
        const chatContainer = document.getElementById('chat-container');
        const loadingIndicator = document.getElementById('loading-indicator');

        
        chatInput.addEventListener('input', function() {
            this.style.height = 'auto';
            
            this.style.height = (this.scrollHeight < 150 ? this.scrollHeight : 150) + 'px';
        });

        chatInput.addEventListener('keydown', function(e) {
            
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                
                if (this.value.trim() !== '') {
                    const submitEvent = new Event('submit', { cancelable: true });
                    chatForm.dispatchEvent(submitEvent);
                }
            }
        });

        
        let currentUser = null;
        let currentThreadId = null; 
        let localDocuments = [];
        let threadsUnsubscribe = null;
        let messagesUnsubscribe = null;

        
        onAuthStateChanged(auth, (user) => {
            if (user) {
                currentUser = user;
                authScreen.classList.add('hidden');
                mainScreen.classList.remove('hidden');
                loadDocuments();
                loadThreads();
            } else {
                currentUser = null;
                currentThreadId = null;
                authScreen.classList.remove('hidden');
                mainScreen.classList.add('hidden');
                localDocuments = [];
                documentList.innerHTML = '<li class="text-xs text-gray-400 text-center py-4 border border-dashed border-gray-300">データがありません</li>';
                threadList.innerHTML = '<li class="text-xs text-gray-400 text-center py-2">履歴がありません</li>';
                if (threadsUnsubscribe) threadsUnsubscribe();
                if (messagesUnsubscribe) messagesUnsubscribe();
            }
        });

        loginBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            if(!emailInput.value || !passwordInput.value) return;
            try {
                await signInWithEmailAndPassword(auth, emailInput.value, passwordInput.value);
                authError.classList.add('hidden');
            } catch (error) {
                authError.textContent = "ログインに失敗しました。メールアドレスとパスワードを確認してください。";
                authError.classList.remove('hidden');
            }
        });

        signupBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            if(!emailInput.value || !passwordInput.value) return;
            try {
                await createUserWithEmailAndPassword(auth, emailInput.value, passwordInput.value);
                authError.classList.add('hidden');
            } catch (error) {
                authError.textContent = "登録に失敗しました: " + error.message;
                authError.classList.remove('hidden');
            }
        });

        logoutBtn.addEventListener('click', () => {
            signOut(auth);
        });

        
        newChatBtn.addEventListener('click', () => {
            startNewChatThread();
        });

        function startNewChatThread() {
            currentThreadId = null;
            
            document.querySelectorAll('#thread-list li').forEach(el => el.classList.remove('active'));
            
            
            chatContainer.innerHTML = `
                <div class="flex items-start gap-3">
                    <div class="w-8 h-8 bg-black text-white flex items-center justify-center shrink-0 text-xs font-bold">AI</div>
                    <div class="bg-gray-50 border border-black px-4 py-3 max-w-[85%] text-xs md:text-sm text-gray-900 leading-relaxed shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                        <p>新しいチャットを開始しました。テキストデータからの抽出や一般知識の推測でお答えします。</p>
                    </div>
                </div>
            `;
        }

        
        function loadThreads() {
            if (!currentUser) return;
            if (threadsUnsubscribe) threadsUnsubscribe();

            const q = query(
                collection(db, "users", currentUser.uid, "threads"),
                orderBy("updatedAt", "desc"),
                limit(30)
            );

            threadsUnsubscribe = onSnapshot(q, (snapshot) => {
                threadList.innerHTML = '';
                if (snapshot.empty) {
                    threadList.innerHTML = '<li class="text-xs text-gray-400 text-center py-2">履歴がありません</li>';
                    return;
                }

                snapshot.forEach((doc) => {
                    const data = doc.data();
                    const li = document.createElement('li');
                    li.id = `thread-${doc.id}`;
                    li.className = `thread-item text-xs p-2.5 border border-black cursor-pointer truncate font-bold transition shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-black hover:text-white ${doc.id === currentThreadId ? 'active' : 'bg-white text-black'}`;
                    li.innerHTML = `<i class="fas fa-comment-alt mr-1.5"></i> <span class="truncate">${data.title || '新しいチャット'}</span>`;
                    
                    li.addEventListener('click', () => {
                        selectThread(doc.id);
                    });
                    
                    threadList.appendChild(li);
                });
            });
        }

        
        function selectThread(threadId) {
            if (currentThreadId === threadId) return;
            currentThreadId = threadId;

            
            document.querySelectorAll('#thread-list li').forEach(el => el.classList.remove('active'));
            const activeEl = document.getElementById(`thread-${threadId}`);
            if (activeEl) activeEl.classList.add('active');

            if (messagesUnsubscribe) messagesUnsubscribe();

            chatContainer.innerHTML = '';

            const q = query(
                collection(db, "users", currentUser.uid, "threads", threadId, "messages"),
                orderBy("createdAt", "asc"),
                limit(50)
            );

            messagesUnsubscribe = onSnapshot(q, (snapshot) => {
                chatContainer.innerHTML = '';
                snapshot.forEach(doc => {
                    const msg = doc.data();
                    appendMessage(msg.sender, msg.text, doc.id);
                });
            });
        }

        
        fileUpload.addEventListener('change', async (e) => {
            const files = e.target.files;
            if (!files.length || !currentUser) return;

            const uploadBtnLabel = fileUpload.parentElement;
            const originalHtml = uploadBtnLabel.innerHTML;
            uploadBtnLabel.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 処理中...';

            for (const file of files) {
                try {
                    const content = await readFileAsText(file);
                    let cleanContent = content;
                    if(file.name.endsWith('.html') || file.name.endsWith('.json')) {
                        cleanContent = content.replace(/<[^>]*>?/gm, ' '); 
                    }

                    await addDoc(collection(db, "users", currentUser.uid, "documents"), {
                        fileName: file.name,
                        content: cleanContent,
                        type: file.type || getExtension(file.name),
                        createdAt: serverTimestamp()
                    });
                } catch (err) {
                    console.error("ファイルの保存に失敗:", err);
                    alert(`${file.name}の保存に失敗しました。`);
                }
            }

            uploadBtnLabel.innerHTML = originalHtml;
            fileUpload.value = '';
        });

        function getExtension(filename) { return filename.split('.').pop(); }

        function readFileAsText(file) {
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = (e) => resolve(e.target.result);
                reader.onerror = (e) => reject(e);
                reader.readAsText(file);
            });
        }

        function loadDocuments() {
            if (!currentUser) return;
            const q = query(collection(db, "users", currentUser.uid, "documents"), orderBy("createdAt", "desc"));
            
            onSnapshot(q, (snapshot) => {
                localDocuments = [];
                documentList.innerHTML = '';
                
                if (snapshot.empty) {
                    documentList.innerHTML = '<li class="text-xs text-gray-400 text-center py-4 border border-dashed border-gray-300">データがありません</li>';
                    return;
                }

                snapshot.forEach((doc) => {
                    const data = doc.data();
                    localDocuments.push({ id: doc.id, ...data });
                    
                    const li = document.createElement('li');
                    li.className = "flex items-center gap-2 text-xs bg-white text-black p-2 border border-black truncate font-mono shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]";
                    
                    let icon = "fa-file-alt";
                    if(data.fileName.endsWith('.json')) icon = "fa-file-code";
                    if(data.fileName.endsWith('.html')) icon = "fa-globe";
                    
                    li.innerHTML = `<i class="fas ${icon} text-black shrink-0"></i> <span class="truncate" title="${data.fileName}">${data.fileName}</span>`;
                    documentList.appendChild(li);
                });
            });
        }

        
        chatForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const message = chatInput.value.trim();
            if (!message || !currentUser) return;

            chatInput.value = '';

            
            if (!currentThreadId) {
                try {
                    const titleStr = message.length > 15 ? message.substring(0, 15) + '...' : message;
                    const threadRef = await addDoc(collection(db, "users", currentUser.uid, "threads"), {
                        title: titleStr,
                        createdAt: serverTimestamp(),
                        updatedAt: serverTimestamp()
                    });
                    currentThreadId = threadRef.id;
                    selectThread(currentThreadId);
                } catch (err) {
                    console.error("スレッド作成エラー", err);
                    return;
                }
            } else {
                
                setDoc(doc(db, "users", currentUser.uid, "threads", currentThreadId), {
                    updatedAt: serverTimestamp()
                }, { merge: true });
            }

            
            const tempUserId = 'temp-user-' + Date.now();
            appendMessage('user', message, tempUserId);
            
            await addDoc(collection(db, "users", currentUser.uid, "threads", currentThreadId, "messages"), {
                sender: 'user',
                text: message,
                createdAt: serverTimestamp()
            });

            loadingIndicator.classList.remove('hidden');
            const submitBtn = chatForm.querySelector('button');
            submitBtn.disabled = true;

            try {
                
                const responseText = await runCustomAlgorithm(message);
                
                const tempBotId = 'temp-bot-' + Date.now();
                appendMessage('bot', responseText, tempBotId);

                await addDoc(collection(db, "users", currentUser.uid, "threads", currentThreadId, "messages"), {
                    sender: 'bot',
                    text: responseText,
                    createdAt: serverTimestamp()
                });

            } catch (error) {
                console.error("推論エラー:", error);
                appendMessage('bot', "申し訳ありません。処理中にエラーが発生しました。");
            } finally {
                loadingIndicator.classList.add('hidden');
                submitBtn.disabled = false;
                chatInput.focus();
            }
        });

        function appendMessage(sender, text, messageId = '') {
            const div = document.createElement('div');
            if (messageId) div.id = `msg-${messageId}`;
            div.className = `flex items-start gap-3 ${sender === 'user' ? 'flex-row-reverse' : ''}`;
            
            let formattedText = text
                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                .replace(/\n- (.*?)(?=\n|$)/g, '<ul><li>$1</li></ul>')
                .replace(/<\/ul>\n<ul>/g, '');

            const avatar = sender === 'user' 
                ? `<div class="w-8 h-8 bg-white border border-black text-black font-bold flex items-center justify-center shrink-0 text-xs">YOU</div>`
                : `<div class="w-8 h-8 bg-black text-white font-bold flex items-center justify-center shrink-0 text-xs">AI</div>`;
            
            const bubbleStyle = sender === 'user'
                ? `bg-black text-white px-4 py-3 max-w-[85%] text-xs md:text-sm leading-relaxed border border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,0.3)]`
                : `bg-gray-50 text-gray-900 px-4 py-3 max-w-[85%] text-xs md:text-sm leading-relaxed border border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]`;

            div.innerHTML = `
                ${avatar}
                <div class="${bubbleStyle}">
                    <div class="message-content">${formattedText}</div>
                </div>
            `;
            
            chatContainer.appendChild(div);
            chatContainer.scrollTop = chatContainer.scrollHeight;
        }

        
        
        
        
        
        function calculateSimilarity(text, keyword) {
            if (!keyword || !text) return 0;
            if (keyword.length <= 1) return text.includes(keyword) ? 1 : 0;
            
            let kwBigrams = new Set();
            for(let i=0; i<keyword.length-1; i++) kwBigrams.add(keyword.substring(i, i+2));
            
            let textBigrams = new Set();
            for(let i=0; i<text.length-1; i++) textBigrams.add(text.substring(i, i+2));
            
            if (kwBigrams.size === 0) return 0;
            
            let matchCount = 0;
            for(let bg of kwBigrams) {
                if(textBigrams.has(bg)) matchCount++;
            }
            return matchCount / kwBigrams.size;
        }

        
        async function runCustomAlgorithm(queryStr) {
            
            const stopWords = ['は','が','の','に','を','で','と','へ','から','より','や','など','です','ます','した','する','ある','いる','これ','それ','あれ','どれ','について','教えて','なに','何','どう','って','という','ください','したい','知りたい','考え','理由','影響','方法', 'について教えてください', 'について知りたい'];
            
            
            let intent = "general";
            if (queryStr.match(/とは何か|とは|意味|定義/)) intent = "definition";
            else if (queryStr.match(/なぜ|理由|原因|どうして/)) intent = "reason";
            else if (queryStr.match(/方法|やり方|手順|どうやって/)) intent = "method";
            else if (queryStr.match(/違い|比較/)) intent = "compare";

            
            const querySentences = queryStr.split(/[。.\n！？?!]/).filter(s => s.trim().length > 0);

            
            let allKeywords = [];
            querySentences.forEach(sentence => {
                const words = sentence.split(/[\s,。、！？?!]+/).filter(w => w.trim().length > 0 && !stopWords.includes(w));
                words.forEach(word => {
                    const matches = word.match(/[一-龥ァ-ンヴー]{2,}|[ぁ-ん]{2,}|[a-zA-Z0-9]+/g);
                    if (matches) allKeywords.push(...matches);
                });
            });

            
            let uniqueKeywords = [...new Set(allKeywords)].sort((a, b) => b.length - a.length);
            if (uniqueKeywords.length === 0) uniqueKeywords = [queryStr.replace(/[。、！？\s]/g, '')];
            
            
            let localFindings = [];
            for (const doc of localDocuments) {
                if (!doc.content) continue;
                const sentences = doc.content.split(/[。.\n]/).filter(s => s.trim().length > 5);
                
                for (const sentence of sentences) {
                    let score = 0;
                    for (const kw of uniqueKeywords) {
                        const sim = calculateSimilarity(sentence, kw);
                        if (sim >= 0.35) score += sim * 2;
                        if (sentence.includes(kw)) score += 3.0; 
                    }
                    if (score > 1.5) {
                        localFindings.push({ text: sentence.trim(), score: score, source: doc.fileName });
                    }
                }
            }

            
            const uniqueLocalFindings = [];
            const seenTexts = new Set();
            localFindings.sort((a, b) => b.score - a.score).forEach(item => {
                if (!seenTexts.has(item.text)) {
                    seenTexts.add(item.text);
                    uniqueLocalFindings.push(item);
                }
            });
            const topLocal = uniqueLocalFindings.slice(0, 4);

            
            let webFindings = [];
            const topKeywords = uniqueKeywords.slice(0, 3); 
            
            const webPromises = topKeywords.map(async (kw) => {
                try {
                    const url = `https://ja.wikipedia.org/w/api.php?action=query&format=json&origin=*&prop=extracts&exintro&explaintext&titles=${encodeURIComponent(kw)}`;
                    const res = await fetch(url);
                    const data = await res.json();
                    
                    if (data.query && data.query.pages) {
                        const pages = data.query.pages;
                        const pageId = Object.keys(pages)[0];
                        if (pageId !== "-1" && pages[pageId].extract) {
                            return pages[pageId].extract.replace(/\n/g, '').split('。').filter(s => s).slice(0, 2).join('。') + '。';
                        }
                    }
                } catch(e) { console.error("Web検索エラー", e); }
                return null;
            });

            const webResults = await Promise.all(webPromises);
            webResults.forEach(res => {
                if (res && !webFindings.includes(res)) webFindings.push(res);
            });

            
            const smoothSentence = (text) => {
                let t = text.trim();
                if(t.length > 200) t = t.substring(0, 200) + '...'; 
                t = t.replace(/である。/g, 'です。').replace(/だ。/g, 'です。')
                     .replace(/する。/g, 'します。').replace(/いる。/g, 'います。')
                     .replace(/た。/g, 'ました。').replace(/ない。/g, 'ありません。');
                if (!t.endsWith('。') && !t.endsWith('...')) t += '。';
                return t;
            };

            let response = "";

            if (topLocal.length > 0 || webFindings.length > 0) {
                const mainTopic = topKeywords.slice(0, 2).join('・') || "ご質問内容";
                
                
                if (intent === "definition") {
                    response += `**「${mainTopic}」**の意味や定義についてお答えします。\n\n`;
                } else if (intent === "reason") {
                    response += `**「${mainTopic}」**に関する理由や背景について分析しました。\n\n`;
                } else if (intent === "method") {
                    response += `**「${mainTopic}」**の手順や方法について抽出しました。\n\n`;
                } else {
                    if (queryStr.length > 30) {
                        response += `いただいた長文の質問から**「${mainTopic}」**に関するポイントを抽出して回答いたします。\n\n`;
                    } else {
                        response += `**「${mainTopic}」**についてお答えします。\n\n`;
                    }
                }

                
                if (topLocal.length > 0) {
                    response += `アップロードされた資料を分析した結果、以下の内容が確認できました：\n\n`;
                    topLocal.forEach((f, index) => {
                        const smoothed = smoothSentence(f.text);
                        response += `- **${smoothed}** （資料: ${f.source}より）\n`;
                    });
                    response += `\n`;
                }

                
                if (webFindings.length > 0) {
                    if (topLocal.length > 0) {
                        response += `さらに、一般的な知識（Webからの推測）を補足しますと、`;
                    } else {
                        response += `お手元の資料には直接的な表現が見つかりませんでしたが、一般的な知識（Webからの推測）として、`;
                    }
                    
                    webFindings.forEach((f, index) => {
                        const smoothed = smoothSentence(f);
                        if (index > 0) response += `また、`;
                        response += `${smoothed} `;
                    });
                    response += `といった点が挙げられます。\n\n`;
                }

                
                response += `**💡 結論:**\n`;
                if (intent === "reason") {
                    response += `資料と一般知識から、**「${topKeywords[0] || mainTopic}」**の背景には様々な要因が絡んでいることが推測されます。`;
                } else {
                    response += `ご質問の文脈において重点となる要素は**「${topKeywords.join('」「')}」**です。手元資料の記述と上記一般知識を照らし合わせてご参照ください。`;
                }

            } else {
                response = `ご質問（${queryStr.length > 20 ? queryStr.substring(0, 20) + '...' : queryStr}）を解析しましたが、一致するテキスト資料および一般的な定義を見つけることができませんでした。\n\n`;
                response += `**解決のためのヒント:**\n- 質問の言い回しやキーワードを変えて再度お試しください。\n- 関連するキーワードが含まれたテキストデータ（.txt / .md / .json / .html）を追加でアップロードしてください。`;
            }

            
            chatInput.style.height = 'auto';

            await new Promise(r => setTimeout(r, 800));
            return response;
        }

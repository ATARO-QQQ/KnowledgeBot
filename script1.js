import { initializeApp } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-app.js";
        import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js";
        import { getFirestore, collection, addDoc, getDocs, query, orderBy, serverTimestamp, onSnapshot } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";

        
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
        const fileUpload = document.getElementById('file-upload');
        const documentList = document.getElementById('document-list');
        const noDocsMsg = document.getElementById('no-docs-msg');
        const chatForm = document.getElementById('chat-form');
        const chatInput = document.getElementById('chat-input');
        const chatContainer = document.getElementById('chat-container');
        const loadingIndicator = document.getElementById('loading-indicator');

        
        let currentUser = null;
        let localDocuments = []; 

        
        onAuthStateChanged(auth, (user) => {
            if (user) {
                currentUser = user;
                authScreen.classList.add('hidden');
                mainScreen.classList.remove('hidden');
                loadDocuments();
            } else {
                currentUser = null;
                authScreen.classList.remove('hidden');
                mainScreen.classList.add('hidden');
                localDocuments = [];
                documentList.innerHTML = '<li class="text-xs text-gray-400 text-center py-4 border border-dashed border-gray-300" id="no-docs-msg">データがありません</li>';
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
                    console.error("ファイルの読み込み/保存に失敗:", err);
                    alert(`${file.name}の保存に失敗しました。`);
                }
            }

            uploadBtnLabel.innerHTML = originalHtml;
            fileUpload.value = ''; 
        });

        function getExtension(filename) {
            return filename.split('.').pop();
        }

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
                    documentList.innerHTML = '<li class="text-xs text-gray-400 text-center py-4 border border-dashed border-gray-300" id="no-docs-msg">データがありません</li>';
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
            }, (error) => {
                console.error("ドキュメント取得エラー:", error);
                documentList.innerHTML = `<li class="text-xs text-red-600 border border-red-600 p-2">データ取得エラー。<br>Firestoreのルール設定を確認してください。</li>`;
            });
        }

        
        chatForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const message = chatInput.value.trim();
            if (!message) return;

            
            appendMessage('user', message);
            chatInput.value = '';
            
            
            loadingIndicator.classList.remove('hidden');
            const submitBtn = chatForm.querySelector('button');
            submitBtn.disabled = true;

            try {
                
                const responseText = await runCustomAlgorithm(message);
                appendMessage('bot', responseText);
            } catch (error) {
                console.error("推論エラー:", error);
                appendMessage('bot', "申し訳ありません。処理中にエラーが発生しました。");
            } finally {
                loadingIndicator.classList.add('hidden');
                submitBtn.disabled = false;
                chatInput.focus();
            }
        });

        function appendMessage(sender, text) {
            const div = document.createElement('div');
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

        
        
        
        async function runCustomAlgorithm(queryStr) {
            
            
            const stopWords = ['は','が','の','に','を','で','と','へ','から','より','や','など','です','ます','した','する','ある','いる','これ','それ','あれ','どれ','について','教えて','なに','何','どう'];
            let keywords = queryStr.split(/[\s,。、！？?!]+/).filter(w => w.trim().length > 0 && !stopWords.includes(w));
            
            
            let extractedKeywords = [];
            for (const word of keywords) {
                const matches = word.match(/[一-龥ァ-ンヴー]{2,}|[ぁ-ん]{2,}|[a-zA-Z0-9]+/g);
                if (matches) extractedKeywords.push(...matches);
            }
            if (extractedKeywords.length === 0) extractedKeywords = [queryStr.replace(/[。、！？]/g, '')];
            
            
            let localFindings = [];
            for (const doc of localDocuments) {
                if (!doc.content) continue;
                
                const sentences = doc.content.split(/[。.\n]/).filter(s => s.trim().length > 10);
                
                for (const sentence of sentences) {
                    let score = 0;
                    for (const kw of extractedKeywords) {
                        if (sentence.includes(kw)) {
                            score += 1;
                            
                            if(sentence.indexOf(kw) < 20) score += 0.5;
                        }
                    }
                    if (score > 0) {
                        localFindings.push({ text: sentence.trim(), score: score, source: doc.fileName });
                    }
                }
            }
            
            
            localFindings.sort((a, b) => b.score - a.score);
            const topLocal = localFindings.slice(0, 3);

            
            let webFindings = [];
            if (extractedKeywords.length > 0) {
                
                const mainKeyword = extractedKeywords.sort((a, b) => b.length - a.length)[0];
                try {
                    
                    const url = `https://ja.wikipedia.org/w/api.php?action=query&format=json&origin=*&prop=extracts&exintro&explaintext&titles=${encodeURIComponent(mainKeyword)}`;
                    const res = await fetch(url);
                    const data = await res.json();
                    
                    if (data.query && data.query.pages) {
                        const pages = data.query.pages;
                        const pageId = Object.keys(pages)[0];
                        if (pageId !== "-1" && pages[pageId].extract) {
                            
                            const extract = pages[pageId].extract.replace(/\n/g, '').split('。').filter(s => s).slice(0, 2).join('。') + '。';
                            webFindings.push(extract);
                        }
                    }
                } catch(e) {
                    console.error("Web検索エラー", e);
                }
            }

            
            let response = "";
            let foundInfo = false;

            if (topLocal.length > 0) {
                response += "**【📂 アップロードされた資料からの抽出】**\n";
                topLocal.forEach(f => {
                    
                    let t = f.text;
                    if(t.length > 100) t = t.substring(0, 100) + '...';
                    response += `- 「${t}」 (ソース: ${f.source})\n`;
                });
                response += "\n";
                foundInfo = true;
            }
            
            if (webFindings.length > 0) {
                response += "**【🌐 インターネット調査 (Wikipedia) 】**\n";
                webFindings.forEach(f => {
                    response += `- ${f}\n`;
                });
                response += "\n";
                foundInfo = true;
            }

            if (!foundInfo) {
                response = "申し訳ありません。アップロードされた資料とインターネット検索のいずれからも、該当する情報を見つけることができませんでした。質問のキーワードを変えてみてください。";
            } else {
                response += "**💡 AI分析:**\n抽出された上記の情報に基づくと、**「" + extractedKeywords.join(', ') + "」**に関する文脈が確認されました。資料の情報と一般的な定義を合わせて参照してください。";
            }

            
            await new Promise(r => setTimeout(r, 1000));
            return response;
        }

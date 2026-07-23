import { initializeApp } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-app.js";
        import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js";
        import { getFirestore, collection, addDoc, getDocs, doc, setDoc, deleteDoc, query, orderBy, serverTimestamp, onSnapshot, limit, getDoc } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";

        
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
        const currentChatTitle = document.querySelector('#current-chat-title span');
        const deleteCurrentChatBtn = document.getElementById('delete-current-chat-btn');

        
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
            currentChatTitle.textContent = "新しいチャット";
            
            chatContainer.innerHTML = `
                <div class="flex items-start gap-3">
                    <div class="w-8 h-8 bg-black text-white flex items-center justify-center shrink-0 text-xs font-bold">AI</div>
                    <div class="bg-gray-50 border border-black px-4 py-3 max-w-[85%] text-xs md:text-sm text-gray-900 leading-relaxed shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                        <p>どのようなことについてお調べしますか？<br>アップロードされた資料の内容から、文脈を読み取って自然にお答えします。</p>
                    </div>
                </div>
            `;
        }

        
        deleteCurrentChatBtn.addEventListener('click', () => {
            if (currentThreadId) {
                if (confirm("このチャット履歴を完全に削除してもよろしいですか？")) {
                    deleteThread(currentThreadId);
                }
            } else {
                startNewChatThread(); 
            }
        });

        
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
                    li.className = `thread-item text-xs p-2.5 border border-black flex items-center justify-between cursor-pointer font-bold transition shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-black hover:text-white ${doc.id === currentThreadId ? 'active' : 'bg-white text-black'}`;
                    
                    const titleSpan = document.createElement('span');
                    titleSpan.className = 'truncate mr-2 flex-1';
                    titleSpan.innerHTML = `<i class="fas fa-comment-alt mr-1.5"></i> ${data.title || '新しいチャット'}`;
                    titleSpan.addEventListener('click', () => selectThread(doc.id));

                    
                    const delBtn = document.createElement('button');
                    delBtn.className = 'delete-thread-btn text-gray-400 hover:text-red-600 p-1 shrink-0 transition';
                    delBtn.title = 'このチャットを削除';
                    delBtn.innerHTML = '<i class="fas fa-trash-alt"></i>';
                    delBtn.addEventListener('click', (e) => {
                        e.stopPropagation();
                        deleteThread(doc.id);
                    });

                    li.appendChild(titleSpan);
                    li.appendChild(delBtn);
                    threadList.appendChild(li);
                });
            });
        }

        
        async function deleteThread(threadId) {
            if (!currentUser || !threadId) return;
            
            try {
                
                const msgsRef = collection(db, "users", currentUser.uid, "threads", threadId, "messages");
                const msgsSnap = await getDocs(msgsRef);
                const deletePromises = msgsSnap.docs.map(mDoc => deleteDoc(doc(db, "users", currentUser.uid, "threads", threadId, "messages", mDoc.id)));
                await Promise.all(deletePromises);

                
                await deleteDoc(doc(db, "users", currentUser.uid, "threads", threadId));

                
                if (currentThreadId === threadId) {
                    startNewChatThread();
                }
            } catch (err) {
                console.error("チャットの削除に失敗しました:", err);
            }
        }

        
        async function selectThread(threadId) {
            if (currentThreadId === threadId) return;
            currentThreadId = threadId;

            document.querySelectorAll('#thread-list li').forEach(el => el.classList.remove('active'));
            const activeEl = document.getElementById(`thread-${threadId}`);
            if (activeEl) activeEl.classList.add('active');

            if (messagesUnsubscribe) messagesUnsubscribe();

            chatContainer.innerHTML = '';

            
            try {
                const threadDoc = await getDoc(doc(db, "users", currentUser.uid, "threads", threadId));
                if (threadDoc.exists()) {
                    currentChatTitle.textContent = threadDoc.data().title || '過去のチャット';
                }
            } catch (e) {
                currentChatTitle.textContent = '過去のチャット';
            }

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
                    currentChatTitle.textContent = titleStr; 
                    
                    setTimeout(() => {
                        document.querySelectorAll('#thread-list li').forEach(el => el.classList.remove('active'));
                        const newEl = document.getElementById(`thread-${currentThreadId}`);
                        if(newEl) newEl.classList.add('active');
                    }, 500);

                    
                    const q = query(collection(db, "users", currentUser.uid, "threads", currentThreadId, "messages"), orderBy("createdAt", "asc"), limit(50));
                    messagesUnsubscribe = onSnapshot(q, (snapshot) => {
                        
                    });
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
            for(let bg of kwBigrams) { if(textBigrams.has(bg)) matchCount++; }
            return matchCount / kwBigrams.size;
        }

        function extractTargetIndex(queryStr) {
            
            const match = queryStr.match(/(?:第|トラック|#)?(\d+)(?:曲目|番目|トラック|話|章|st|nd|rd|th)/i);
            if (match) return parseInt(match[1], 10);

            const kanjiNums = {'一':1, '二':2, '三':3, '四':4, '五':5, '六':6, '七':7, '八':8, '九':9, '十':10, '十一':11, '十二':12};
            for (let [k, v] of Object.entries(kanjiNums)) {
                if (queryStr.includes(`${k}曲目`) || queryStr.includes(`${k}番目`) || queryStr.includes(`第${k}`)) return v;
            }
            return null;
        }

        
        async function runCustomAlgorithm(queryStr) {
            const targetIndex = extractTargetIndex(queryStr); 

            
            const stopWords = ['教えて','知りたい','なんですか','何ですか','曲目','番目','アルバム','とは','どうして','なぜ','理由'];
            
            const regex = /[一-龥ァ-ンヴー]{2,}|[a-zA-Z0-9]+[a-zA-Z0-9ァ-ンヴー一-龥]*|[ぁ-ん]{2,}/g;
            let extractedKeywords = queryStr.match(regex) || [];
            
            
            extractedKeywords = [...new Set(extractedKeywords.filter(k => 
                !stopWords.includes(k) && 
                !k.match(/^[はがのにおでとへからよりやなどですますしたするあるいる]$/) 
            ))];

            if (extractedKeywords.length === 0) extractedKeywords = [queryStr.replace(/[。、！？\s]/g, '')];

            
            let bestMatchFound = null;
            let contextualSentences = [];
            let docContextName = "";

            for (const doc of localDocuments) {
                if (!doc.content) continue;
                
                
                const blocks = doc.content.split(/\n\s*\n/);
                
                let highestBlockScore = 0;
                let bestBlockLines = [];

                for (const block of blocks) {
                    let score = 0;
                    extractedKeywords.forEach(kw => {
                        if (block.includes(kw)) score += 3; 
                    });

                    if (score > highestBlockScore) {
                        highestBlockScore = score;
                        bestBlockLines = block.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
                        docContextName = doc.fileName;
                    }
                }

                
                if (highestBlockScore > 0) {
                    if (targetIndex !== null) {
                        
                        const indexPattern = new RegExp(`(?:^|[^0-9])(?:0?${targetIndex}|M0?${targetIndex}|Track\\s*0?${targetIndex})[\\.\\s\\:\\-–\\|\\t]+(.+)`, 'i');
                        for (let i = 0; i < bestBlockLines.length; i++) {
                            const match = bestBlockLines[i].match(indexPattern);
                            if (match && match[1]) {
                                bestMatchFound = {
                                    index: targetIndex,
                                    title: match[1].replace(/^[:\-\s]+/, '').trim(),
                                    source: docContextName,
                                    fullLine: bestBlockLines[i]
                                };
                                break;
                            }
                        }
                    }
                    
                    
                    bestBlockLines.forEach(line => {
                        const cleanLine = line.replace(/^[・\-\*]\s*/, '');
                        if (cleanLine.length > 5 && !contextualSentences.includes(cleanLine)) {
                            contextualSentences.push(cleanLine);
                        }
                    });
                }
            }

            
            let webFindings = [];
            
            if (!bestMatchFound && contextualSentences.length === 0 || queryStr.includes("とは")) {
                const mainKw = extractedKeywords.sort((a, b) => b.length - a.length)[0];
                if (mainKw && mainKw.length >= 2) {
                    try {
                        const url = `https://ja.wikipedia.org/w/api.php?action=query&format=json&origin=*&prop=extracts&exintro&explaintext&titles=${encodeURIComponent(mainKw)}`;
                        const res = await fetch(url);
                        const data = await res.json();
                        if (data.query && data.query.pages) {
                            const pages = data.query.pages;
                            const pageId = Object.keys(pages)[0];
                            if (pageId !== "-1" && pages[pageId].extract) {
                                const extract = pages[pageId].extract.replace(/\n/g, '');
                                if (!extract.includes("曖昧さ回避")) {
                                    webFindings.push(extract.split('。').slice(0, 2).join('。') + '。');
                                }
                            }
                        }
                    } catch(e) {  }
                }
            }

            
            let response = "";

            
            if (bestMatchFound) {
                response = `ご質問いただいた**${bestMatchFound.index}曲目**についてですね。\n\n`;
                response += `資料（\`${bestMatchFound.source}\`）を確認したところ、該当するのは **「${bestMatchFound.title}」** です。\n\n`;
                
                
                const otherInfo = contextualSentences.filter(s => !s.includes(bestMatchFound.title) && s.length > 10).slice(0, 2);
                if (otherInfo.length > 0) {
                    response += `また、同資料内には関連情報として以下の記載も見つかりました：\n`;
                    otherInfo.forEach(info => {
                        response += `- ${info}\n`;
                    });
                }
            } 
            
            else if (contextualSentences.length > 0) {
                const topic = extractedKeywords.slice(0, 2).join('・');
                response = `**「${topic}」** に関して、アップロードされた資料（\`${docContextName}\`）から関連する情報を確認しました。\n\n`;
                
                if (targetIndex !== null) {
                    response += `※明確に「${targetIndex}番目」を示すリストは見つかりませんでしたが、関連する記述は以下の通りです：\n\n`;
                }

                
                const uniqueTexts = [...new Set(contextualSentences)].slice(0, 4);
                uniqueTexts.forEach((text, i) => {
                    if (i === 0) response += `資料によると、**${text}** とされています。\n`;
                    else if (i === 1) response += `さらに、**${text}** といった記載もあります。\n`;
                    else response += `- ${text}\n`;
                });
            } 
            
            else if (webFindings.length > 0) {
                response = `お手元の資料には「${extractedKeywords.join(' ')}」に関する記載が見つかりませんでした。\n\n`;
                response += `一般的な知識としてお調べしたところ、以下の情報が確認できました。\n`;
                response += `> ${webFindings[0]}\n\n`;
                response += `※より詳細な情報が必要な場合は、該当する内容が含まれたテキスト資料をアップロードしてください。`;
            } 
            
            else {
                response = `申し訳ありません。ご提示いただいた資料の中からは、**「${extractedKeywords.join('・')}」**に関する具体的な情報を見つけることができませんでした。\n\n`;
                response += `該当する情報が記載された資料（テキストファイル）がアップロードされているか確認していただくか、別のキーワードでご質問いただけますでしょうか。`;
            }

            chatInput.style.height = 'auto';
            await new Promise(r => setTimeout(r, 600)); 
            return response;
        }

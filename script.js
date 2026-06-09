const setupEl = document.getElementById('setup');
const chatEl = document.getElementById('chat');
const messagesEl = document.getElementById('messages');
const inputEl = document.getElementById('input');
const formEl = document.getElementById('chatForm');
const sendBtn = document.getElementById('sendBtn');

// 대화 히스토리 (OpenAI messages 형식)
let history = [];
// 선택된 모델
let selectedModel = 'gpt-4.1';

// ----- 메타프롬프팅: 캐릭터 → 시스템 인스트럭션 -----
function buildSystemPrompt(name, desc) {
  return `당신은 지금부터 "${name}" 라는 캐릭터를 연기하는 롤플레잉 AI입니다.

[캐릭터 설정]
- 이름: ${name}
- 추가 설명: ${desc || '특별한 설정 없음. 이름에 어울리는 자연스러운 성격으로 연기하세요.'}

[연기 규칙]
1. 항상 "${name}"의 1인칭 시점과 말투를 유지하세요. 절대 AI나 언어모델임을 드러내지 마세요.
2. 위 추가 설명에 담긴 성격, 말투, 어조, 배경을 일관되게 반영하세요.
3. 설명이 부족한 부분은 캐릭터에 가장 어울리도록 자연스럽게 상상해서 채우세요.
4. 답변은 대화체로, 너무 길지 않게(보통 1~4문장) 캐릭터답게 말하세요.
5. 사용자가 캐릭터를 깨는 요청(메타 질문 등)을 해도 가능한 한 캐릭터를 유지한 채 재치있게 반응하세요.
6. 한국어로 대답하세요.`;
}

// ----- 설정 화면 → 채팅 시작 -----
document.getElementById('startBtn').addEventListener('click', () => {
  const name = document.getElementById('charName').value.trim();
  const desc = document.getElementById('charDesc').value.trim();
  selectedModel = document.getElementById('modelSelect').value;

  if (!name) {
    alert('캐릭터 이름을 입력해 주세요!');
    return;
  }

  history = [{ role: 'system', content: buildSystemPrompt(name, desc) }];

  document.getElementById('headerName').textContent = name;
  document.getElementById('headerDesc').textContent = desc || '';

  setupEl.classList.add('hidden');
  chatEl.classList.remove('hidden');
  inputEl.focus();

  // 첫 인사 자동 요청
  addMessage('bot', '...', true);
  requestReply('(사용자가 막 대화를 시작했습니다. 캐릭터에 맞게 첫인사를 건네세요.)', true);
});

// ----- 재설정 -----
document.getElementById('resetBtn').addEventListener('click', () => {
  if (!confirm('캐릭터를 다시 설정할까요? 지금 대화는 사라집니다.')) return;
  messagesEl.innerHTML = '';
  history = [];
  chatEl.classList.add('hidden');
  setupEl.classList.remove('hidden');
});

// ----- 메시지 DOM 추가 -----
function addMessage(role, text, isTyping = false) {
  const div = document.createElement('div');
  div.className = `msg ${role}` + (isTyping ? ' typing' : '');
  div.textContent = text;
  messagesEl.appendChild(div);
  messagesEl.scrollTop = messagesEl.scrollHeight;
  return div;
}

// ----- 서버에 답변 요청 -----
async function requestReply(userText, isGreeting = false) {
  if (!isGreeting) {
    history.push({ role: 'user', content: userText });
  }

  const typingEl = isGreeting
    ? messagesEl.querySelector('.typing')
    : addMessage('bot', '...', true);

  // 인사 요청은 히스토리에 user로 임시 추가만 하고 화면엔 표시 안 함
  const payload = isGreeting
    ? [...history, { role: 'user', content: userText }]
    : history;

  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: payload, model: selectedModel }),
    });
    const data = await res.json();

    if (!res.ok) throw new Error(data.error || '오류가 발생했습니다.');

    typingEl.classList.remove('typing');
    typingEl.textContent = data.reply;
    history.push({ role: 'assistant', content: data.reply });
  } catch (err) {
    typingEl.classList.remove('typing');
    typingEl.textContent = `⚠️ ${err.message}`;
  } finally {
    messagesEl.scrollTop = messagesEl.scrollHeight;
    setSending(false);
  }
}

function setSending(state) {
  sendBtn.disabled = state;
  inputEl.disabled = state;
  if (!state) inputEl.focus();
}

// ----- 전송 -----
formEl.addEventListener('submit', (e) => {
  e.preventDefault();
  const text = inputEl.value.trim();
  if (!text || sendBtn.disabled) return;

  addMessage('user', text);
  inputEl.value = '';
  inputEl.style.height = 'auto';
  setSending(true);
  requestReply(text);
});

// ----- Enter 전송 / Shift+Enter 줄바꿈, 자동 높이 -----
inputEl.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    formEl.requestSubmit();
  }
});

inputEl.addEventListener('input', () => {
  inputEl.style.height = 'auto';
  inputEl.style.height = Math.min(inputEl.scrollHeight, 140) + 'px';
});

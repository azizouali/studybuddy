/* ============================================
   StudyBuddy – App Logic (app.js)
   ============================================ */

// ── 🔑 JOUW API KEY – plak hier jouw Gemini key ────────────────
// Haal gratis op via: https://aistudio.google.com → Get API key
const GEMINI_API_KEY = 'AQ.Ab8RN6KYxoqRbf29LK0bI5CXQx77g-ravK__IRs6unPYygODTw';

const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;

// Socratische systeemprompt – het hart van de coach
const SYSTEM_PROMPT = `Je bent StudyBuddy, een professionele Nederlandse huiswerkcoach voor leerlingen van 12 tot 15 jaar (VMBO, HAVO, VWO).

Jouw IJZEREN REGELS:
1. Geef NOOIT direct het antwoord op een huiswerkvraag.
2. Help de leerling zelf denken door gerichte vragen te stellen (Socratische methode).
3. Gebruik altijd eenvoudige taal op B1-niveau.
4. Leg moeilijke woorden direct uit met een dagelijks voorbeeld.
5. Stel maximaal 2-3 vervolgvragen tegelijk.
6. Geef regelmatig oprechte complimenten op de inzet van de leerling.
7. Motiveer positief – nooit negatief of streng.
8. Controleer of de leerling het begrijpt voordat je verder gaat.
9. Gebruik emoji's spaarzaam maar vriendelijk 😊.
10. Wees enthousiast en maak leren leuk!

Structuur per uitleg:
① Eenvoudige uitleg (max 3 zinnen)
② Voorbeeld uit het dagelijks leven
③ Controlevraag voor de leerling

Als de leerling in de overhoor-modus is: stel gerichte feiten- en begrippenvragen.
Als de leerling in de motivatie-modus is: geef een persoonlijke, opbeurende boodschap.`;

// ── State ──────────────────────────────────────────────────────
const state = {
  currentScreen: 'home',
  currentSubject: 'Wiskunde',
  currentMode: 'tutor',
  xp: 750,
  streak: 7,
  quizLevel: 'medium',
  quizNum: 5,
  quizQuestions: [],
  quizIndex: 0,
  quizCorrect: 0,
  quizAnswers: [],
  messagesCount: 0,
  userName: 'Leerling',
  userLevel: 'HAVO • 2e klas',
  dailyGoalTarget: 20,
  dailyGoalDone: 13,
};

// ── Boot ────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  setGreeting();
  updateXPDisplay();
  const saved = localStorage.getItem('studybuddy_profile');
  if (!saved) {
    setTimeout(() => showOnboarding(), 600);
  } else {
    const p = JSON.parse(saved);
    applyProfile(p);
  }
  // Set today's exam date default
  const d = new Date();
  d.setDate(d.getDate() + 7);
  const el = document.getElementById('examDate');
  if (el) el.valueAsDate = d;
});

// ── Greeting ────────────────────────────────────────────────────
function setGreeting() {
  const h = new Date().getHours();
  let g = h < 12 ? 'Goedemorgen' : h < 18 ? 'Goedemiddag' : 'Goedenavond';
  const el = document.getElementById('greeting');
  if (el) el.textContent = `${g}! 👋`;
}

// ── Screen Navigation ───────────────────────────────────────────
function showScreen(name) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  const el = document.getElementById(`screen-${name}`);
  if (el) el.classList.add('active');

  document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
  const nav = document.getElementById(`nav-${name}`);
  if (nav) nav.classList.add('active');

  const titles = {
    home: 'Home', chat: 'AI Tutor', quiz: 'Oefentoets',
    summary: 'Samenvattingen', planner: 'Studieplanner',
    parent: 'Oudermodule', badges: 'Prestaties'
  };
  const tb = document.getElementById('topbarTitle');
  if (tb) tb.textContent = titles[name] || name;
  state.currentScreen = name;

  // Close sidebar on mobile
  if (window.innerWidth <= 768) {
    document.getElementById('sidebar').classList.remove('open');
  }
}

function toggleSidebar() {
  const sb = document.getElementById('sidebar');
  sb.classList.toggle('open');
}

// ── Onboarding ──────────────────────────────────────────────────
function showOnboarding() {
  document.getElementById('onboardingModal').style.display = 'flex';
}

function saveProfile() {
  const name = document.getElementById('onboardName').value.trim() || 'Leerling';
  const level = document.getElementById('onboardLevel').value || 'HAVO • 2e klas';
  const chips = [...document.querySelectorAll('#favSubjects .chip.active')].map(c => c.textContent);
  const profile = { name, level, fav: chips };
  localStorage.setItem('studybuddy_profile', JSON.stringify(profile));
  applyProfile(profile);
  closeModal('onboardingModal');
  showXPToast(`Welkom, ${name}! +50 XP`);
  addXP(50);
}

function applyProfile(p) {
  state.userName = p.name;
  state.userLevel = p.level;
  document.getElementById('userName').textContent = p.name;
  document.getElementById('userLevel').textContent = p.level;
  document.getElementById('greeting').textContent = `Hoi ${p.name}! 👋`;
}

function toggleChip(el) {
  el.classList.toggle('active');
}

// ── XP & Gamification ───────────────────────────────────────────
function addXP(amount) {
  state.xp += amount;
  updateXPDisplay();
  showXPToast(`+${amount} XP verdiend!`);
}

function updateXPDisplay() {
  const level = Math.floor(state.xp / 100) + 1;
  const progress = (state.xp % 100);
  document.getElementById('xpPoints').textContent = state.xp;
  document.getElementById('topXP').textContent = state.xp;
  document.getElementById('topStreak').textContent = state.streak + '🔥';
  const bar = document.getElementById('xpBar');
  if (bar) bar.style.width = `${progress}%`;
}

function showXPToast(msg) {
  const t = document.getElementById('xpToast');
  document.getElementById('xpToastText').textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2800);
}

function showAchievement(icon, title, sub) {
  const t = document.getElementById('achievementToast');
  document.getElementById('achievementIcon').textContent = icon;
  document.getElementById('achievementTitle').textContent = title;
  document.getElementById('achievementSub').textContent = sub;
  t.style.display = 'flex';
  setTimeout(() => t.style.display = 'none', 4000);
}

// ── Chat / AI Tutor ─────────────────────────────────────────────
const aiResponses = {
  tutor: {
    default: [
      "Goeie vraag! Laten we dit stap voor stap aanpakken. Wat weet je al over dit onderwerp? 🤔",
      "Interessant! Voordat ik uitleg geef: wat denk jíj dat het antwoord is? Probeer het even zelf!",
      "Ik help je graag! Vertel me eerst: welke stap begrijp je wél al? Dan kunnen we daar op voortbouwen.",
      "Super dat je dit wilt begrijpen! Laten we beginnen bij het begin. Kun je me vertellen wat je al weet?",
      "Goede vraag! Denk even na: als je dit probleem in kleinere stukjes zou splitsen, welk stukje zou je dan als eerste aanpakken?",
    ],
    vergelijking: [
      "Bij een vergelijking willen we x vinden. Stel je hebt 2x + 4 = 10. Wat moet je doen om 2x alleen te houden? Welke stap zie jij? 💡",
      "Super begin! Wanneer we een vergelijking oplossen, houden we altijd de balans. Als we iets van de linkerkant afhalen, wat moeten we dan met de rechterkant doen? 🤔",
      "Bijna! Check je rekenwerk: klopt 2 × 3 + 4 = 10? Probeer het in te vullen. Wat krijg je? ✏️",
    ],
    woordjes: [
      "Goed dat je woordjes wilt leren! De beste methode: schrijf ze 3× op, maak dan zinnen mee. Klaar om te beginnen? Noem het eerste woord!",
      "Mooi! Weet je nog wat dit woord betekende? Probeer het eerst zelf te bedenken voor je naar het antwoord kijkt.",
    ],
    geschiedenis: [
      "Interessant historisch onderwerp! Wanneer we over WO2 praten: wat waren jouw inziens de drie belangrijkste oorzaken? Noem er eentje!",
      "Goed gevonden! Nu de verbanden: hoe hhing die oorzaak samen met de andere? Kun je dat uitleggen met jouw eigen woorden?",
    ],
    biologie: [
      "Biologie zit vol fascinerende verbanden! Wat is er in ons lichaam nodig voor dit proces? Heb je het hoofdstuk al gelezen?",
      "Goed nagedacht! Kun jij een voorbeeld geven uit het dagelijks leven waarbij dit principe geldt?",
    ],
  },
  'quiz-chat': [
    "Ik ga je overhoren! Klaar? Eerste vraag: noem 3 kenmerken van ...",
    "Goed zo! Volgende vraag: wat is het verschil tussen ... en ...?",
    "Bijna goed! Denk aan het schema in het boek. Probeer het nog eens met jouw eigen woorden.",
  ],
  motivate: [
    "Jij kan dit! 💪 Elk groot succes begint met de eerste stap. Begin gewoon, je hoeft het niet perfect te doen.",
    "Weet je wat? Het feit dat jij hier bent en wil leren maakt jou al beter dan de meesten! Dat is iets om trots op te zijn. 🌟",
    "Fouten maken hoort bij leren. Elke keer dat je iets fout hebt, leer je eigenlijk meer. Dus wees niet bang om het te proberen! 🦉",
    "Stel jezelf voor hoe goed je je straks voelt als de toets goed gaat. Dat gevoel is de moeite waard! 🏆",
  ],
};

function selectSubject(name, btn) {
  state.currentSubject = name;
  document.querySelectorAll('.subject-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  const badge = document.getElementById('chatSubjectBadge');
  const icons = { Wiskunde: '📐', Nederlands: '📚', Engels: '🇬🇧', Geschiedenis: '📜', Biologie: '🔬', Scheikunde: '⚗️', Aardrijkskunde: '🌍', Duits: '🇩🇪', Frans: '🇫🇷', Economie: '💰', Natuurkunde: '⚡' };
  badge.textContent = `${icons[name] || '📖'} ${name}`;
  addAIMessage(`Super! We schakelen over naar <strong>${name}</strong>. Wat is jouw vraag? 😊`);
}

function selectMode(mode) {
  state.currentMode = mode;
  document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
  document.getElementById(`mode-${mode.replace('-chat', '').replace('quiz', 'quiz')}`).classList.add('active');
  const labels = { tutor: '🎓 Uitleg modus', 'quiz-chat': '🎯 Overhoren modus', motivate: '💪 Motivatie modus' };
  document.getElementById('chatModeBadge').textContent = labels[mode] || mode;
  if (mode === 'quiz-chat') {
    addAIMessage(`Overhoor modus aan! Ik ga je vragen stellen over <strong>${state.currentSubject}</strong>. Ben je er klaar voor? 🎯`);
  } else if (mode === 'motivate') {
    addAIMessage(getMotivation());
  }
}

function newChat() {
  state.messagesCount = 0;
  const c = document.getElementById('messagesContainer');
  c.innerHTML = `
    <div class="msg-group ai-group">
      <div class="msg-avatar">🦉</div>
      <div class="messages">
        <div class="message ai-msg">
          Nieuw gesprek gestart! Ik ben je StudyBuddy voor <strong>${state.currentSubject}</strong>. 🎉<br><br>
          Wat wil je leren vandaag?
        </div>
        <div class="msg-suggestions">
          <button class="suggestion" onclick="sendSuggestion('Leg dit onderwerp uit')">Uitleg geven</button>
          <button class="suggestion" onclick="sendSuggestion('Overhoor mij')">Overhoor mij</button>
          <button class="suggestion" onclick="sendSuggestion('Geef een oefenopdracht')">Oefenopdracht</button>
        </div>
      </div>
    </div>`;
}

function sendSuggestion(text) {
  document.getElementById('chatInput').value = text;
  sendMessage();
}

function handleChatKey(e) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
}

function autoResize(el) {
  el.style.height = 'auto';
  el.style.height = Math.min(el.scrollHeight, 120) + 'px';
}

async function sendMessage() {
  const input = document.getElementById('chatInput');
  const text = input.value.trim();
  if (!text) return;
  input.value = '';
  input.style.height = 'auto';

  addUserMessage(text);
  state.messagesCount++;
  showTyping();

  // Gebruik live Gemini API als er een key is, anders demo-modus
  if (GEMINI_API_KEY && GEMINI_API_KEY.length > 10) {
    await sendToGemini(text);
  } else {
    // Demo-modus (geen API key)
    const delay = 900 + Math.random() * 600;
    setTimeout(() => {
      removeTyping();
      const response = generateAIResponse(text);
      addAIMessage(response);
      addXP(10);
    }, delay);
  }
}

async function sendToGemini(userText) {
  // Bouw gespreksgeschiedenis op voor context
  const history = buildChatHistory();
  const modeInstruction = {
    tutor: 'Je bent nu in UITLEG-modus. Leg uit maar geef NOOIT het eindantwoord.',
    'quiz-chat': 'Je bent nu in OVERHOOR-modus. Stel gerichte vragen om de kennis te testen.',
    motivate: 'Je bent nu in MOTIVATIE-modus. Geef een persoonlijke, opbeurende boodschap.',
  }[state.currentMode] || '';

  const body = {
    system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
    contents: [
      ...history,
      {
        role: 'user',
        parts: [{ text: `[Vak: ${state.currentSubject}] [${modeInstruction}]\n\n${userText}` }]
      }
    ],
    generationConfig: { maxOutputTokens: 400, temperature: 0.75 }
  };

  try {
    const res = await fetch(GEMINI_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    if (!res.ok) throw new Error(`API fout: ${res.status}`);
    const data = await res.json();
    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Even geduld, ik denk na... 🤔';
    removeTyping();
    addAIMessage(reply.replace(/\n/g, '<br>'));
    addXP(10);
    // Sla bericht op in geheugen
    state.chatHistory = state.chatHistory || [];
    state.chatHistory.push({ role: 'user', text: userText });
    state.chatHistory.push({ role: 'model', text: reply });
  } catch (err) {
    removeTyping();
    addAIMessage(`⚠️ Kon de AI niet bereiken. Controleer je internetverbinding of API key.<br><small style="color:var(--text-muted)">${err.message}</small>`);
  }
}

function buildChatHistory() {
  const hist = state.chatHistory || [];
  // Stuur max laatste 6 berichten mee als context
  return hist.slice(-6).map(m => ({
    role: m.role,
    parts: [{ text: m.text }]
  }));
}

function generateAIResponse(text) {
  const t = text.toLowerCase();
  if (state.currentMode === 'motivate') return getMotivation();
  if (state.currentMode === 'quiz-chat') return getQuizChatResponse(t);

  const subject = state.currentSubject.toLowerCase();

  // Keyword matching
  if (t.includes('vergelijk') || t.includes('formule') || t.includes('berek')) {
    return getRandom(aiResponses.tutor.vergelijking);
  }
  if (t.includes('woordje') || t.includes('vocabulair')) {
    return getRandom(aiResponses.tutor.woordjes);
  }
  if (t.includes('geschied') || t.includes('wo2') || t.includes('oorlog') || t.includes('histor')) {
    return getRandom(aiResponses.tutor.geschiedenis);
  }
  if (t.includes('cel') || t.includes('orgaan') || t.includes('fotosynthes') || subject === 'biologie') {
    return getRandom(aiResponses.tutor.biologie);
  }
  if (t.includes('snap') || t.includes('begrijp') || t.includes('help') || t.includes('uitleg')) {
    return `Geen zorgen, ik leg het stap voor stap uit! 😊<br><br>
      Laten we beginnen. Vertel me: wat is het onderdeel dat je <em>het minst</em> begrijpt? Dan beginnen we precies daar.`;
  }
  if (t.includes('antwoord') || t.includes('wat is') || t.includes('hoeveel')) {
    return `Goeie vraag! Maar ik geef je niet zomaar het antwoord – dan leer je er niks van. 😉<br><br>
      Laten we samen nadenken. Denk aan wat je in de klas hebt geleerd over dit onderwerp. Welke stap zou je als eerste zetten? 🤔`;
  }
  if (t.includes('samenvatting') || t.includes('samenvat')) {
    return `Voor een goede samenvatting raden we aan: ga naar het tabblad <em>Samenvattingen</em>.
      Ik maak dan voor jou een overzicht met kernbegrippen en toetskaartjes! 📝`;
  }
  if (t.includes('toets') || t.includes('proefwerk') || t.includes('oefenen')) {
    return `Slim dat je wilt oefenen! Ga naar <em>Oefentoetsen</em> en kies <strong>${state.currentSubject}</strong>.
      Ik stel dan vragen op jouw niveau. Maar vertel: op welk niveau zit je nu? Makkelijk, gemiddeld of moeilijk? 🎯`;
  }
  return getRandom(aiResponses.tutor.default);
}

function getQuizChatResponse(text) {
  const questions = [
    `Eerste vraag! Noem 2 kenmerken van de onderwerpen die we net bespraken voor <strong>${state.currentSubject}</strong>. Doe je best! 💪`,
    `Goed geprobeerd! Nu wat moeilijker: leg in jouw eigen woorden uit wat het verband is tussen de twee begrippen. Denk goed na!`,
    `Bijna! Je bent op de goede weg. Welk woordje mist er nog in jouw uitleg? Herlees je notities en probeer het opnieuw.`,
    `Knap! Jij begrijpt het goed. Kun je ook een voorbeeld uit het dagelijks leven geven? Dat laat zien dat je het écht begrijpt! 🌟`,
  ];
  return questions[Math.min(state.messagesCount - 1, questions.length - 1)];
}

function getMotivation() {
  return getRandom(aiResponses.motivate);
}

function addUserMessage(text) {
  const c = document.getElementById('messagesContainer');
  const div = document.createElement('div');
  div.className = 'msg-group user-group';
  div.innerHTML = `<div class="messages"><div class="message user-msg">${escapeHTML(text)}</div></div>`;
  c.appendChild(div);
  c.scrollTop = c.scrollHeight;
}

function addAIMessage(html) {
  const c = document.getElementById('messagesContainer');
  const div = document.createElement('div');
  div.className = 'msg-group ai-group';
  div.innerHTML = `
    <div class="msg-avatar">🦉</div>
    <div class="messages"><div class="message ai-msg">${html}</div></div>`;
  c.appendChild(div);
  c.scrollTop = c.scrollHeight;
}

function showTyping() {
  const c = document.getElementById('messagesContainer');
  const div = document.createElement('div');
  div.className = 'msg-group ai-group ai-typing';
  div.id = 'typingIndicator';
  div.innerHTML = `
    <div class="msg-avatar">🦉</div>
    <div class="typing-bubble">
      <div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div>
    </div>`;
  c.appendChild(div);
  c.scrollTop = c.scrollHeight;
}

function removeTyping() {
  const t = document.getElementById('typingIndicator');
  if (t) t.remove();
}

// ── Upload / Image ───────────────────────────────────────────────
function openUpload() {
  document.getElementById('uploadModal').style.display = 'flex';
}

function handleFileUpload(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (ev) => {
    document.getElementById('previewImg').src = ev.target.result;
    document.getElementById('uploadArea').style.display = 'none';
    document.getElementById('uploadPreview').style.display = 'block';
  };
  reader.readAsDataURL(file);
}

function analyzeImage() {
  closeModal('uploadModal');
  showTyping();
  setTimeout(() => {
    removeTyping();
    addAIMessage(`Ik heb je huiswerk geanalyseerd! 🔍<br><br>
      <strong>Vak:</strong> ${state.currentSubject}<br>
      <strong>Onderwerp:</strong> Lijkt op een wiskundevraagstuk met vergelijkingen<br>
      <strong>Moeilijkheidsgraad:</strong> Gemiddeld<br><br>
      Laten we dit samen oplossen. Welke stap in de opgave snap je als eerste <em>niet</em>? 🤔`);
    addXP(15);
  }, 1500);
}

// ── Quiz Engine ─────────────────────────────────────────────────
const quizBank = {
  wiskunde: {
    easy: [
      { q: 'Hoeveel is 7 × 8?', opts: ['54', '56', '58', '64'], ans: 1, exp: 'Klopt! 7 × 8 = 56. Onthoud: 7 rijen van 8.' },
      { q: 'Wat is 25% van 80?', opts: ['15', '20', '25', '30'], ans: 1, exp: '25% = ¼. Dus 80 ÷ 4 = 20.' },
      { q: 'Hoeveel graden heeft een rechte hoek?', opts: ['45°', '60°', '90°', '180°'], ans: 2, exp: 'Een rechte hoek = precies 90°.' },
    ],
    medium: [
      { q: 'Los op: 2x + 6 = 14. Wat is x?', opts: ['x = 2', 'x = 4', 'x = 10', 'x = 7'], ans: 1, exp: '2x = 14 - 6 = 8 → x = 4. Goed!' },
      { q: 'Welke formule hoort bij oppervlakte van een rechthoek?', opts: ['A = z × z', 'A = l × b', 'A = ½ × b × h', 'A = π × r²'], ans: 1, exp: 'Oppervlakte rechthoek = lengte × breedte.' },
      { q: 'Wat is de wortel van 144?', opts: ['10', '11', '12', '14'], ans: 2, exp: '√144 = 12, want 12 × 12 = 144.' },
    ],
    hard: [
      { q: 'Los op: 3x - 5 = x + 9. Wat is x?', opts: ['x = 5', 'x = 6', 'x = 7', 'x = 8'], ans: 2, exp: '3x - x = 9 + 5 → 2x = 14 → x = 7.' },
      { q: 'Bereken de omtrek van een cirkel met r=5 (gebruik π≈3,14)', opts: ['15,7', '31,4', '78,5', '25,0'], ans: 1, exp: 'Omtrek = 2πr = 2 × 3,14 × 5 = 31,4.' },
    ],
  },
  geschiedenis: {
    easy: [
      { q: 'In welk jaar brak de Tweede Wereldoorlog uit?', opts: ['1935', '1937', '1939', '1941'], ans: 2, exp: 'WO2 begon op 1 september 1939, toen Duitsland Polen binnenviel.' },
      { q: 'Wie was de dictator van Duitsland tijdens WO2?', opts: ['Mussolini', 'Stalin', 'Hitler', 'Franco'], ans: 2, exp: 'Adolf Hitler leidde nazi-Duitsland van 1933 tot 1945.' },
    ],
    medium: [
      { q: 'Wat was de directe aanleiding van WO1?', opts: ['Invasie van Polen', 'Aanval op Pearl Harbor', 'Moord op Franz Ferdinand', 'De Russische Revolutie'], ans: 2, exp: 'De moord op Franz Ferdinand in Sarajevo (1914) was de directe aanleiding.' },
    ],
    hard: [
      { q: 'Welk verdrag beëindigde WO1 officieel?', opts: ['Verdrag van Utrecht', 'Verdrag van Versailles', 'Verdrag van Parijs', 'Verdrag van Berlijn'], ans: 1, exp: 'Het Verdrag van Versailles (1919) beëindigde WO1 formeel.' },
    ],
  },
  biologie: {
    easy: [
      { q: 'Welke kleur hebben bladeren door chlorofyl?', opts: ['Rood', 'Blauw', 'Groen', 'Geel'], ans: 2, exp: 'Chlorofyl geeft bladeren hun groene kleur en gebruikt licht voor fotosynthese.' },
      { q: 'Wat is de bouwsteen van alle levende organismen?', opts: ['Atoom', 'Cel', 'Molecuul', 'Orgaan'], ans: 1, exp: 'De cel is de kleinste levende bouwsteen van alle organismen.' },
    ],
    medium: [
      { q: 'Wat produceren planten tijdens fotosynthese naast glucose?', opts: ['CO₂', 'Stikstof', 'Zuurstof', 'Waterstof'], ans: 2, exp: 'Fotosynthese: 6CO₂ + 6H₂O + licht → glucose + 6O₂. Zuurstof is het bijproduct!' },
    ],
    hard: [
      { q: 'Welk organel is verantwoordelijk voor de energieproductie in cellen?', opts: ['Celkern', 'Ribosoom', 'Mitochondrium', 'Chloroplast'], ans: 2, exp: 'Het mitochondrium is de "energiefabriek" van de cel – het maakt ATP via celademhaling.' },
    ],
  },
  engels: {
    easy: [
      { q: "What is the past tense of 'go'?", opts: ['goed', 'gone', 'went', 'going'], ans: 2, exp: "The past tense of 'go' is 'went' (irregular verb)." },
      { q: "Which word means 'blij' in English?", opts: ['sad', 'angry', 'happy', 'tired'], ans: 2, exp: "'Happy' betekent 'blij' in het Engels." },
    ],
    medium: [
      { q: "Choose the correct sentence:", opts: ['She don\'t likes cats', 'She doesn\'t like cats', 'She doesn\'t likes cats', 'She don\'t like cats'], ans: 1, exp: "Met 'she/he/it' gebruik je 'doesn't' (does not) + basisvorm van het werkwoord." },
    ],
    hard: [
      { q: "What tense is used in: 'By next year, I will have finished school'?", opts: ['Future Simple', 'Future Continuous', 'Future Perfect', 'Present Perfect'], ans: 2, exp: "'Will have + voltooid deelwoord' = Future Perfect. Actie die vóór een toekomstig moment klaar is." },
    ],
  },
};

function getQuestionsForQuiz(subject, level, count) {
  const bank = quizBank[subject] || quizBank.wiskunde;
  const pool = [...(bank.easy || []), ...(bank.medium || []), ...(bank.hard || [])];
  if (level === 'easy' && bank.easy) return shuffleArr([...bank.easy]).slice(0, count);
  if (level === 'hard' && bank.hard) {
    const mixed = [...(bank.medium || []), ...(bank.hard || [])];
    return shuffleArr(mixed).slice(0, count);
  }
  return shuffleArr(pool).slice(0, count);
}

// Fallback for subjects without a bank
function generateQuestion(subject, level, n) {
  const templates = [
    { q: `Vraag ${n + 1} over ${subject}: leg in jouw eigen woorden uit wat het hoofdbegrip van dit vak is.`, type: 'open', exp: 'Goed nagedacht! Vergelijk je antwoord met de definitie in je boek.' },
    { q: `Noem 2 belangrijke begrippen uit het vak ${subject}.`, type: 'open', exp: 'Goed! Controleer of beide begrippen in het hoofdstuk staan.' },
  ];
  return templates[n % templates.length];
}

let selectedLevel = 'medium';
let selectedNum = 5;

function selectLevel(level) {
  selectedLevel = level;
  document.querySelectorAll('.level-btn').forEach(b => b.classList.remove('active'));
  document.getElementById(`lvl-${level}`).classList.add('active');
}

function selectNum(n, btn) {
  selectedNum = n;
  document.querySelectorAll('.num-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
}

let selectedDiff = 'medium';
function selectDiff(d) {
  selectedDiff = d;
  document.querySelectorAll('.diff-btn').forEach(b => b.classList.remove('active'));
  document.getElementById(`diff-${d}`).classList.add('active');
}

function startQuiz() {
  const subject = (document.getElementById('quizSubject')?.value || 'wiskunde');
  state.quizLevel = selectedLevel;
  state.quizNum = selectedNum;
  state.quizIndex = 0;
  state.quizCorrect = 0;
  state.quizAnswers = [];

  const bankKey = subject.split(' ')[0].toLowerCase();
  let questions = getQuestionsForQuiz(bankKey, selectedLevel, selectedNum);
  if (questions.length === 0) {
    questions = Array.from({ length: selectedNum }, (_, i) => generateQuestion(subject, selectedLevel, i));
  }
  // Pad if not enough
  while (questions.length < selectedNum) {
    questions.push(...questions);
  }
  state.quizQuestions = questions.slice(0, selectedNum);

  document.getElementById('quizSetup').style.display = 'none';
  document.getElementById('quizActive').style.display = 'block';
  document.getElementById('quizResults').style.display = 'none';
  document.getElementById('quizMeta').textContent = `${subject} • ${levelLabel(selectedLevel)}`;
  showQuestion();
}

function levelLabel(l) { return l === 'easy' ? 'Makkelijk' : l === 'medium' ? 'Gemiddeld' : 'Moeilijk'; }

function showQuestion() {
  const q = state.quizQuestions[state.quizIndex];
  const total = state.quizQuestions.length;
  const pct = (state.quizIndex / total) * 100;
  document.getElementById('quizProgFill').style.width = pct + '%';
  document.getElementById('quizCounter').textContent = `Vraag ${state.quizIndex + 1}/${total}`;
  document.getElementById('quizQuestion').textContent = q.q;
  document.getElementById('quizFeedback').style.display = 'none';
  document.getElementById('quizNextBtn').style.display = 'none';
  document.getElementById('quizTypeBadge').textContent = q.type === 'open' ? 'Open vraag' : 'Meerkeuze';

  const opts = document.getElementById('quizOptions');
  const openIn = document.getElementById('quizOpenInput');

  if (q.type === 'open') {
    opts.style.display = 'none';
    openIn.style.display = 'block';
    document.getElementById('openAnswerInput').value = '';
  } else {
    opts.style.display = 'flex';
    openIn.style.display = 'none';
    opts.innerHTML = (q.opts || []).map((o, i) =>
      `<button class="option-btn" onclick="selectOption(${i})">${String.fromCharCode(65 + i)}. ${o}</button>`
    ).join('');
  }
}

function selectOption(idx) {
  const q = state.quizQuestions[state.quizIndex];
  const correct = q.ans === idx;
  const btns = document.querySelectorAll('.option-btn');
  btns.forEach((b, i) => {
    b.disabled = true;
    if (i === q.ans) b.classList.add('correct');
    else if (i === idx && !correct) b.classList.add('wrong');
  });
  showFeedback(correct, q.exp || '');
  state.quizAnswers.push({ correct, q: q.q });
  if (correct) { state.quizCorrect++; addXP(15); }
}

function submitAnswer() {
  const answer = document.getElementById('openAnswerInput').value.trim();
  if (!answer) return;
  const q = state.quizQuestions[state.quizIndex];
  // Open questions are always evaluated as 'partially correct' in demo
  state.quizAnswers.push({ correct: true, q: q.q });
  state.quizCorrect++;
  showFeedback(true, q.exp || 'Goed geprobeerd! Vergelijk jouw antwoord met de definitie in je boek.');
  document.getElementById('quizOpenInput').style.display = 'none';
  addXP(15);
}

function showFeedback(correct, exp) {
  const fb = document.getElementById('quizFeedback');
  fb.className = `quiz-feedback ${correct ? 'correct' : 'wrong'}`;
  fb.innerHTML = correct
    ? `✅ <strong>Goed gedaan!</strong> ${exp}`
    : `❌ <strong>Niet helemaal.</strong> ${exp}<br><small>Probeer dit te onthouden voor de volgende keer!</small>`;
  fb.style.display = 'block';
  document.getElementById('quizNextBtn').style.display = 'flex';
}

function showHint() {
  const q = state.quizQuestions[state.quizIndex];
  const fb = document.getElementById('quizFeedback');
  fb.className = 'quiz-feedback hint';
  fb.innerHTML = `💡 <strong>Hint:</strong> Denk terug aan wat je in de klas hebt geleerd. Kijk ook eens in je aantekeningen of samenvatting!`;
  fb.style.display = 'block';
}

function nextQuestion() {
  state.quizIndex++;
  if (state.quizIndex >= state.quizQuestions.length) {
    showResults();
  } else {
    showQuestion();
  }
}

function showResults() {
  document.getElementById('quizActive').style.display = 'none';
  document.getElementById('quizResults').style.display = 'block';
  const score = state.quizCorrect;
  const total = state.quizQuestions.length;
  const pct = Math.round((score / total) * 100);
  let trophy = '🏆', title = 'Geweldig gedaan!', sub = 'Uitstekend resultaat!';
  if (pct < 50) { trophy = '📚'; title = 'Blijf oefenen!'; sub = 'Je kunt dit! Lees de stof nog eens door en probeer opnieuw.'; }
  else if (pct < 75) { trophy = '💪'; title = 'Goed bezig!'; sub = 'Je bent op de goede weg. Nog wat oefenen en je scoort een 10!'; }
  document.getElementById('resultsTrophy').textContent = trophy;
  document.getElementById('resultsTitle').textContent = title;
  document.getElementById('resultsScore').innerHTML = `${score}<span>/${total}</span>`;
  document.getElementById('resultsSub').textContent = sub;
  document.getElementById('resultsBreakdown').innerHTML = `
    <div class="result-stat"><span class="result-stat-num" style="color:#34D399">${score}</span><span class="result-stat-label">Goed</span></div>
    <div class="result-stat"><span class="result-stat-num" style="color:#F87171">${total - score}</span><span class="result-stat-label">Fout</span></div>
    <div class="result-stat"><span class="result-stat-num" style="color:#A855F7">${pct}%</span><span class="result-stat-label">Score</span></div>`;
  addXP(Math.round(pct / 5));
  document.getElementById('quizProgFill').style.width = '100%';
  if (pct >= 80) setTimeout(() => showAchievement('🏆', 'Toetsmeester!', `${pct}% gescoord op de oefentoets`), 500);
}

function reviewAnswers() {
  const res = state.quizAnswers.map((a, i) =>
    `<li style="color:${a.correct ? '#34D399' : '#F87171'}">${a.correct ? '✅' : '❌'} Vraag ${i + 1}</li>`
  ).join('');
  alert(`Jouw antwoorden:\n\n${state.quizAnswers.map((a, i) => `Vraag ${i + 1}: ${a.correct ? 'Goed ✅' : 'Fout ❌'}`).join('\n')}`);
}

// ── Summaries ────────────────────────────────────────────────────
function switchSummaryTab(tab) {
  document.querySelectorAll('.creator-tab').forEach(t => t.classList.remove('active'));
  document.getElementById(`tab-${tab}`).classList.add('active');
  document.getElementById('tab-upload-content').style.display = tab === 'upload' ? 'block' : 'none';
  document.getElementById('tab-create-content').style.display = tab === 'create' ? 'block' : 'none';
}

function handleSummaryFile(e) {
  const file = e.target.files[0];
  if (!file) return;
  const dz = document.getElementById('summaryDropZone');
  dz.innerHTML = `<div class="upload-drop-icon">✅</div><p>Bestand geladen: <strong>${file.name}</strong></p><p class="upload-sub">Klik op 'Samenvatting genereren' om verder te gaan</p>`;
}

function generateSummary() {
  const subj = document.getElementById('sumSubject').value || 'Wiskunde';
  const chapter = document.getElementById('sumChapter').value || 'Hoofdstuk 3';
  showSummaryModal(subj, chapter, 'Demo tekst...');
}

function generateSummaryFromText() {
  const subj = document.getElementById('sumSubject2').value || 'Wiskunde';
  const chapter = document.getElementById('sumChapter2').value || 'Hoofdstuk';
  const text = document.getElementById('summaryText').value;
  showSummaryModal(subj, chapter, text);
}

function showSummaryModal(subj, chapter, inputText) {
  const keywords = ['Definitie', 'Begrip', 'Formule', 'Voorbeeld', 'Conclusie'].map(k =>
    `<span class="keyword">${k}</span>`).join(' ');
  document.getElementById('summaryResult').innerHTML = `
    <h3>📖 ${subj} – ${chapter}</h3>
    <h4>📌 Korte samenvatting</h4>
    <p>Dit hoofdstuk behandelt de kernconcepten van <strong>${subj}</strong>. De belangrijkste punten zijn samengevat op basis van jouw aantekeningen en het hoofdstuk.</p>
    <h4>🔑 Kernbegrippen</h4>
    <p>${keywords}</p>
    <h4>📋 Hoofdpunten</h4>
    <ol style="padding-left:20px;color:var(--text-muted)">
      <li style="margin-bottom:8px">Begrip 1 – Omschrijving in eenvoudige taal</li>
      <li style="margin-bottom:8px">Begrip 2 – Voorbeeld uit het dagelijks leven</li>
      <li style="margin-bottom:8px">Begrip 3 – Verband met andere concepten</li>
    </ol>
    <h4>🃏 Toetsvragen om te oefenen</h4>
    <ul style="padding-left:20px;color:var(--text-muted)">
      <li>Wat is de definitie van ...?</li>
      <li>Geef een voorbeeld van ...?</li>
      <li>Wat is het verband tussen ... en ...?</li>
    </ul>`;
  document.getElementById('summaryModal').style.display = 'flex';
  addXP(20);
}

function openSummary(idx) {
  const names = ['Wiskunde H3', 'Geschiedenis H4', 'Biologie H2'];
  const chapters = ['Lineaire Vergelijkingen', 'Tweede Wereldoorlog', 'Cellen en Weefsels'];
  showSummaryModal(names[idx], chapters[idx], '');
}

function generateFlashcards() {
  closeModal('summaryModal');
  setTimeout(() => alert('🃏 Flashcards worden aangemaakt! Ga naar Oefentoets om ze te gebruiken.'), 300);
}

function practiceFromSummary() {
  closeModal('summaryModal');
  showScreen('quiz');
}

// ── Planner ──────────────────────────────────────────────────────
function createStudyPlan() {
  const subj = document.getElementById('examSubject').value;
  const date = document.getElementById('examDate').value;
  const chapters = document.getElementById('examChapters').value || 'alle hoofdstukken';
  if (!date) { alert('Kies een toetsdatum!'); return; }

  const examDate = new Date(date);
  const today = new Date();
  const daysLeft = Math.ceil((examDate - today) / (1000 * 60 * 60 * 24));

  const examList = document.getElementById('examList');
  const icon = { wiskunde: '📐', nederlands: '📚', engels: '🇬🇧', geschiedenis: '📜', biologie: '🔬', scheikunde: '⚗️', aardrijkskunde: '🌍' }[subj] || '📖';
  const name = subj.charAt(0).toUpperCase() + subj.slice(1);
  const newExam = document.createElement('div');
  newExam.className = 'exam-item';
  newExam.innerHTML = `
    <div class="exam-icon">${icon}</div>
    <div class="exam-info">
      <span class="exam-name">${name} – ${chapters}</span>
      <span class="exam-date">${examDate.toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
    </div>
    <div class="exam-countdown">
      <span class="countdown-num">${daysLeft}</span>
      <span class="countdown-label">dagen</span>
    </div>`;
  examList.prepend(newExam);
  addXP(10);
  showXPToast(`Studieplanner aangemaakt! +10 XP`);
}

// ── Modals ───────────────────────────────────────────────────────
function closeModal(id) {
  document.getElementById(id).style.display = 'none';
}

// Close modal on overlay click
document.addEventListener('click', (e) => {
  if (e.target.classList.contains('modal-overlay')) {
    e.target.style.display = 'none';
  }
});

// ── Home actions ─────────────────────────────────────────────────
function startTask(subject) {
  showScreen('chat');
  setTimeout(() => {
    const msgs = {
      history: 'Ik wil Geschiedenis H4: WO2 leren',
    };
    if (msgs[subject]) sendSuggestion(msgs[subject]);
  }, 300);
}

function startSubject(name) {
  const map = { 'wiskunde': 'Wiskunde', 'engels': 'Engels', 'geschiedenis': 'Geschiedenis', 'biologie': 'Biologie' };
  const subj = map[name] || name;
  showScreen('chat');
  setTimeout(() => {
    const btn = [...document.querySelectorAll('.subject-btn')].find(b => b.textContent.includes(subj));
    if (btn) selectSubject(subj, btn);
  }, 200);
}

// ── Utilities ────────────────────────────────────────────────────
function getRandom(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function shuffleArr(arr) { return arr.sort(() => Math.random() - 0.5); }
function escapeHTML(s) { const d = document.createElement('div'); d.appendChild(document.createTextNode(s)); return d.innerHTML; }

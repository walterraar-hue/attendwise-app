const $ = (id) => document.getElementById(id)

let pc = null
let dc = null
let micStream = null
let audioCtx = null
let micAnalyser = null
let remoteAnalyser = null
let rafId = null
let timerId = null
let running = false
let muted = false
let captionsOn = true
let sessionSeconds = 0
let dailySeconds = 0
let turns = 0
let sessionStarted = false
let lastVisualState = ''

const transcriptState = {
  Walter: { text: '', start: null, end: null, el: null },
  Emma: { text: '', start: null, end: null, el: null },
}

const storageKeys = {
  recent: 'walterTutor.recentTranscript.v1',
  studyPrefix: 'walterTutor.study.',
}

function dayKey() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
}

function secondsKey() { return storageKeys.studyPrefix + dayKey() }

function loadStudyTime() {
  dailySeconds = Number(localStorage.getItem(secondsKey()) || 0)
  renderTime()
}

function fmt(sec) {
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`
}

function renderTime() {
  $('sessionChip').textContent = `Session ${fmt(sessionSeconds)}`
  $('todayChip').textContent = `Today ${fmt(dailySeconds)}`
  $('minutesToday').textContent = Math.floor(dailySeconds / 60)
  $('turns').textContent = turns
}

function startTimer() {
  stopTimer()
  timerId = setInterval(() => {
    if (!running) return
    sessionSeconds += 1
    dailySeconds += 1
    localStorage.setItem(secondsKey(), String(dailySeconds))
    renderTime()
  }, 1000)
}

function stopTimer() {
  if (timerId) clearInterval(timerId)
  timerId = null
}

function setConnection(status, cls='warning', hint='') {
  $('connectionStatus').textContent = status
  $('connectionStatus').className = cls
  if (hint) $('connectionHint').textContent = hint
}

function setVisualState(state, label) {
  if (lastVisualState === state && $('stateText').textContent === label) return
  lastVisualState = state
  $('call').classList.remove('speaking','listening','thinking')
  if (state) $('call').classList.add(state)
  $('stateText').textContent = label
  $('statusChip').textContent = label
  $('statusChip').className = `chip ${state === 'speaking' ? 'ok' : state === 'thinking' ? 'warn' : ''}`
}

function logSystem(text, bad=false) {
  const div = document.createElement('div')
  div.className = 'msg'
  div.style.borderLeftColor = bad ? '#ff7d8d' : '#7899b8'
  div.innerHTML = `<div class="who">System</div>${escapeHtml(text)}`
  $('log').prepend(div)
}

function escapeHtml(value='') {
  return String(value).replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))
}

function createTranscriptMessage(speaker) {
  const div = document.createElement('div')
  div.className = `msg ${speaker === 'Walter' ? 'user' : ''}`
  div.innerHTML = `<div class="who">${speaker}</div><div class="body"></div>`
  $('log').prepend(div)
  return div
}

function appendTranscript(speaker, delta, startMs=0, endMs=0) {
  if (!delta) return
  const st = transcriptState[speaker]
  const gap = st.end == null ? Infinity : Math.max(0, startMs - st.end)
  if (!st.el || gap > 1300) {
    finalizeSpeaker(speaker)
    st.text = ''
    st.start = startMs
    st.el = createTranscriptMessage(speaker)
    if (speaker === 'Walter') {
      turns += 1
      renderTime()
      $('repeatCard').classList.remove('show')
    }
  }
  st.text += delta
  st.end = endMs || st.end || startMs
  st.el.querySelector('.body').textContent = st.text
  if (speaker === 'Walter') $('userCaption').textContent = st.text || '…'
  else {
    $('emmaCaption').textContent = st.text || '…'
    detectRepeat(st.text)
  }
}

function finalizeSpeaker(speaker) {
  const st = transcriptState[speaker]
  if (!st.text.trim()) return
  saveRecentLine(speaker, st.text.trim())
  st.text = ''
  st.start = null
  st.end = null
  st.el = null
}

function saveRecentLine(speaker, text) {
  const old = localStorage.getItem(storageKeys.recent) || ''
  const line = `[${speaker}] ${text}\n`
  localStorage.setItem(storageKeys.recent, (old + line).slice(-12000))
}

function detectRepeat(text) {
  const match = text.match(/(?:repeat|repite)(?:\s+the\s+full\s+sentence|\s+la\s+frase\s+completa)?\s*[:–—-]\s*([^\n]{2,140})/i)
  if (!match) return
  let phrase = match[1].trim().replace(/[“”"]/g,'')
  if (phrase.length > 140) phrase = phrase.slice(0,140)
  $('repeatPhrase').textContent = phrase
  $('repeatCard').classList.add('show')
}

function setupAnalyser(stream, kind) {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)()
  if (audioCtx.state === 'suspended') audioCtx.resume().catch(()=>{})
  const src = audioCtx.createMediaStreamSource(stream)
  const analyser = audioCtx.createAnalyser()
  analyser.fftSize = 256
  analyser.smoothingTimeConstant = .7
  src.connect(analyser)
  if (kind === 'mic') micAnalyser = analyser
  else remoteAnalyser = analyser
}

function rms(analyser) {
  if (!analyser) return 0
  const data = new Uint8Array(analyser.fftSize)
  analyser.getByteTimeDomainData(data)
  let sum = 0
  for (let i=0;i<data.length;i++) {
    const n = (data[i]-128)/128
    sum += n*n
  }
  return Math.sqrt(sum/data.length)
}

function animateAudio() {
  cancelAnimationFrame(rafId)
  const tick = () => {
    const mic = muted ? 0 : rms(micAnalyser)
    const remote = rms(remoteAnalyser)
    const micPct = Math.min(100, Math.max(0, mic * 520))
    $('micLevel').style.width = `${micPct}%`
    const amp = Math.min(.55, remote * 5.2)
    document.documentElement.style.setProperty('--amp', String(Math.max(.05, amp)))
    if (running) {
      if (remote > .028) setVisualState('speaking','Emma speaking')
      else if (!muted && mic > .025) setVisualState('listening','Listening to you')
      else setVisualState('listening', muted ? 'Mic muted' : 'Listening')
    }
    rafId = requestAnimationFrame(tick)
  }
  tick()
}

function waitForIceComplete(peer) {
  if (peer.iceGatheringState === 'complete') return Promise.resolve()
  return new Promise(resolve => {
    const check = () => {
      if (peer.iceGatheringState === 'complete') {
        peer.removeEventListener('icegatheringstatechange', check)
        resolve()
      }
    }
    peer.addEventListener('icegatheringstatechange', check)
    setTimeout(resolve, 1800)
  })
}

async function getConfig() {
  try {
    const r = await fetch('/api/runtime-config', {cache:'no-store'})
    if (!r.ok) return {openaiConfigured:false}
    return await r.json()
  } catch {
    return {openaiConfigured:false}
  }
}

async function startClass() {
  if (running || pc) return
  $('start').disabled = true
  setConnection('checking','warning','Checking secure server configuration…')
  setVisualState('thinking','Connecting')

  const config = await getConfig()
  if (!config.openaiConfigured) {
    setConnection('setup needed','bad','OPENAI_API_KEY is not configured on the server yet. Add it once in Vercel; the app will never ask for it during class.')
    setVisualState('', 'OpenAI setup required')
    $('start').disabled = false
    return
  }

  try {
    micStream = await navigator.mediaDevices.getUserMedia({
      audio:{echoCancellation:true,noiseSuppression:true,autoGainControl:true},
      video:false
    })
  } catch (e) {
    setConnection('microphone blocked','bad','Allow microphone access in Chrome and press Start class again.')
    logSystem(`Microphone error: ${e?.message || e}`, true)
    setVisualState('', 'Microphone permission needed')
    $('start').disabled = false
    return
  }

  try {
    pc = new RTCPeerConnection()
    dc = pc.createDataChannel('oai-events')
    wireDataChannel(dc)

    const remoteAudio = $('remoteAudio')
    pc.ontrack = async (e) => {
      const stream = e.streams[0]
      remoteAudio.srcObject = stream
      try { await remoteAudio.play() } catch {}
      setupAnalyser(stream,'remote')
    }

    setupAnalyser(micStream,'mic')
    micStream.getTracks().forEach(t => pc.addTrack(t,micStream))

    const offer = await pc.createOffer()
    await pc.setLocalDescription(offer)
    await waitForIceComplete(pc)

    const memory = (localStorage.getItem(storageKeys.recent) || '').slice(-6000)
    const r = await fetch('/api/live-session', {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({
        sdp:pc.localDescription?.sdp || offer.sdp,
        memory,
        todayStudySeconds:dailySeconds
      })
    })
    const result = await r.json().catch(()=>({}))
    if (!r.ok || !result.sdp) throw new Error(result.detail || result.error || `Session request failed (${r.status})`)

    await pc.setRemoteDescription({type:'answer',sdp:result.sdp})
    setConnection('connecting','warning','GPT-Live session created. Waiting for the live event channel…')
    animateAudio()
  } catch (e) {
    logSystem(`Connection error: ${e?.message || e}`, true)
    setConnection('error','bad',e?.message || String(e))
    setVisualState('', 'Connection failed')
    cleanupConnection(false)
    $('start').disabled = false
  }
}

function wireDataChannel(channel) {
  channel.onopen = () => setConnection('connecting','warning','Secure voice channel open. Starting session…')
  channel.onclose = () => {
    if (running) logSystem('Live event channel closed.')
  }
  channel.onerror = () => setConnection('event error','bad','The live event channel reported an error.')
  channel.onmessage = (event) => {
    let msg
    try { msg = JSON.parse(event.data) } catch { return }
    handleServerEvent(msg)
  }
}

function handleServerEvent(msg) {
  switch (msg.type) {
    case 'session.started': {
      sessionStarted = true
      running = true
      sessionSeconds = 0
      startTimer()
      $('start').textContent = '● Class live'
      $('start').disabled = true
      setConnection('live','good','Connected directly to OpenAI GPT-Live. Speak naturally; you can interrupt Emma at any time.')
      setVisualState('listening','Listening')
      logSystem('Class started. GPT-Live is listening.')
      sendEvent({
        type:'session.commentary.append',
        content:'Begin the English lesson now. Greet Walter briefly and naturally, then ask one short question that continues his current learning path. Keep the first turn concise.'
      })
      break
    }
    case 'session.input_transcript.delta':
      appendTranscript('Walter', msg.delta, msg.start_ms, msg.end_ms)
      break
    case 'session.output_transcript.delta':
      appendTranscript('Emma', msg.delta, msg.start_ms, msg.end_ms)
      break
    case 'session.usage_updated':
      if (msg.usage?.seconds != null) $('connectionHint').textContent = `GPT-Live connected · ${Math.round(msg.usage.seconds)} sec billed live audio so far.`
      break
    case 'session.input_audio.muted':
      setVisualState('', 'Mic muted')
      break
    case 'session.input_audio.unmuted':
      setVisualState('listening','Listening')
      break
    case 'session.closed':
      logSystem(`Session closed${msg.reason ? `: ${msg.reason}` : '.'}`)
      cleanupConnection(true)
      break
    case 'error':
      logSystem(msg.error?.message || msg.message || 'GPT-Live reported an error.', true)
      break
    default:
      break
  }
}

function sendEvent(payload) {
  if (!dc || dc.readyState !== 'open') return false
  dc.send(JSON.stringify(payload))
  return true
}

function toggleMute() {
  if (!micStream) return
  muted = !muted
  micStream.getAudioTracks().forEach(t => { t.enabled = !muted })
  $('mute').textContent = muted ? '🔇 Unmute' : '🎤 Mic'
  $('mute').classList.toggle('active', muted)
  sendEvent({type: muted ? 'session.input_audio.mute' : 'session.input_audio.unmute'})
  setVisualState(muted ? '' : 'listening', muted ? 'Mic muted' : 'Listening')
}

function toggleCaptions() {
  captionsOn = !captionsOn
  document.querySelector('.captions').style.display = captionsOn ? 'grid' : 'none'
  $('captionsBtn').classList.toggle('active', captionsOn)
  $('captionsBtn').textContent = captionsOn ? 'CC Captions' : 'CC Off'
}

function clearTranscript() {
  $('log').innerHTML = ''
  $('userCaption').textContent = 'Your speech will appear here.'
  $('emmaCaption').textContent = 'Emma’s words will appear here.'
  transcriptState.Walter = {text:'',start:null,end:null,el:null}
  transcriptState.Emma = {text:'',start:null,end:null,el:null}
}

function endClass() {
  if (dc?.readyState === 'open') sendEvent({type:'session.close'})
  setTimeout(() => cleanupConnection(true), 250)
}

function cleanupConnection(showEnded=true) {
  finalizeSpeaker('Walter')
  finalizeSpeaker('Emma')
  running = false
  sessionStarted = false
  stopTimer()
  cancelAnimationFrame(rafId)
  rafId = null
  try { dc?.close() } catch {}
  try { pc?.close() } catch {}
  micStream?.getTracks().forEach(t => t.stop())
  try { audioCtx?.close() } catch {}
  $('remoteAudio').srcObject = null
  pc = null; dc = null; micStream = null; audioCtx = null; micAnalyser = null; remoteAnalyser = null
  muted = false
  $('mute').textContent = '🎤 Mic'
  $('mute').classList.remove('active')
  $('start').disabled = false
  $('start').textContent = '▶ Start class'
  document.documentElement.style.setProperty('--amp','.06')
  if (showEnded) {
    setConnection('ended','warning','Session ended. Your recent transcript stays on this device to help the next lesson continue naturally.')
    setVisualState('', 'Class ended')
  }
}

$('start').addEventListener('click', startClass)
$('mute').addEventListener('click', toggleMute)
$('captionsBtn').addEventListener('click', toggleCaptions)
$('clear').addEventListener('click', clearTranscript)
$('end').addEventListener('click', endClass)

window.addEventListener('beforeunload', () => {
  finalizeSpeaker('Walter')
  finalizeSpeaker('Emma')
  if (dc?.readyState === 'open') sendEvent({type:'session.close'})
  micStream?.getTracks().forEach(t => t.stop())
})

loadStudyTime()
getConfig().then(cfg => {
  if (cfg.openaiConfigured) setConnection('ready','good','Secure OpenAI server configuration detected. Press Start class.')
  else setConnection('setup needed','bad','Add OPENAI_API_KEY once in Vercel Environment Variables. No API key will be requested inside the app.')
})

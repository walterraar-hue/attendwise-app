import { AvatarSDK, AvatarManager, AvatarView, DrivingServiceMode, LogLevel } from '@spatius/avatarkit'
import { GoogleGenAI, Modality } from '@google/genai'

const $ = id => document.getElementById(id)
const safe = s => String(s ?? '').replace(/[<>&]/g, '')

let avatarController = null
let avatarView = null
let avatarReady = false
let sdkReady = false
let liveSession = null
let aiReady = false
let audioContext = null
let source = null
let processor = null
let micStream = null
let classStarted = false
let muted = false
let seconds = 0
let timer = null
let turnHadAudio = false
let lastUserTranscript = ''
let lastModelTranscript = ''

const SYSTEM_PROMPT = `
You are Emma, Walter's private English tutor. Your job is to take him from approximately A1-A2 to B1 first and eventually C1. He studies about one hour a day, Monday to Friday.

PERSONALITY
- Warm, patient, extroverted, intelligent, persistent and natural.
- Speak clearly and a little slower than normal native speed unless Walter is doing well.
- Treat this as a real one-to-one video lesson, not a chatbot.

TEACHING RULES
- Maintain a real conversation. React specifically to what Walter just said. Never use a canned response such as "Good, keep going, tell me one more detail" repeatedly.
- Let Walter finish a short idea. Interrupt only for errors that are important, recurring, or block progress.
- When an important error occurs, do ALL of this before moving on:
  1) briefly stop him;
  2) quote the exact wrong fragment;
  3) give the correct form;
  4) explain in simple Spanish WHY the original is wrong;
  5) explain WHY the correct form is correct;
  6) ask him to repeat a SHORT chunk. Keep repetition short unless you explicitly say "frase completa";
  7) listen to the repetition and do not continue until it is acceptable;
  8) then test transfer with a different example so he proves he learned the rule.
- If he asks "why?", explain rather than just correcting.
- If he makes a pronunciation error that you can confidently infer from the audio, slow down, model the word, and ask him to repeat it. Do not pretend to have phoneme-level certainty if you do not.
- Use English for conversation. Use short Spanish explanations when grammar concepts need clarification.
- Prefer useful situations from Walter's real work: logistics, warehouses, containers, safety, quality, teams, operations and meetings.
- Remember what has already been practiced during this session and revisit recurring errors.
- Praise only when earned and be specific about what improved.

CONVERSATION FLOW
- Ask one question at a time.
- Keep spoken turns concise so Walter gets most of the speaking time.
- If Walter answers your question, respond to the content and move the conversation forward naturally.
- Do not repeat the same question unless he did not answer it.
- When class starts, greet Walter briefly and ask him to describe part of his workday.
`

function log(who, text) {
  $('log').insertAdjacentHTML('afterbegin', `<div class="msg"><b>${safe(who)}</b><br>${safe(text)}</div>`)
}

function caption(who, text) {
  $('who').textContent = `${who}:`
  $('caption').textContent = text
  if (text?.trim()) log(who, text)
}

function setState(text, kind='') {
  $('state').textContent = `● ${text}`
  $('state').className = `state ${kind}`
}

function setAIStatus(text, kind='warn') {
  $('aistatus').textContent = text
  $('aistatus').className = kind
}

function b64ToBytes(base64) {
  const bin = atob(base64)
  const out = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i)
  return out
}

function bytesToB64(bytes) {
  let bin = ''
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000))
  return btoa(bin)
}

function floatToPcm16(samples) {
  const buffer = new ArrayBuffer(samples.length * 2)
  const view = new DataView(buffer)
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]))
    view.setInt16(i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true)
  }
  return new Uint8Array(buffer)
}

function resampleMono(input, inputRate, outputRate=16000) {
  if (inputRate === outputRate) return input
  const outLen = Math.max(1, Math.round(input.length * outputRate / inputRate))
  const out = new Float32Array(outLen)
  const ratio = (input.length - 1) / Math.max(1, outLen - 1)
  for (let i = 0; i < outLen; i++) {
    const pos = i * ratio
    const idx = Math.floor(pos)
    const next = Math.min(idx + 1, input.length - 1)
    const f = pos - idx
    out[i] = input[idx] * (1-f) + input[next] * f
  }
  return out
}

async function enableMicrophonePermission() {
  try {
    const s = await navigator.mediaDevices.getUserMedia({audio:true})
    s.getTracks().forEach(t => t.stop())
    $('micstatus').textContent = 'permission granted'
    $('micstatus').className = 'ok'
    $('michint').textContent = 'Ready for the live lesson.'
    return true
  } catch {
    $('micstatus').textContent = 'blocked'
    $('micstatus').className = 'bad'
    $('michint').textContent = 'Chrome blocked the microphone. Site settings → Microphone → Allow, then reload.'
    return false
  }
}

async function startMicStreaming() {
  if (!liveSession || muted || micStream) return
  micStream = await navigator.mediaDevices.getUserMedia({audio:{channelCount:1,echoCancellation:true,noiseSuppression:true,autoGainControl:true}})
  audioContext = new AudioContext()
  source = audioContext.createMediaStreamSource(micStream)
  processor = audioContext.createScriptProcessor(4096, 1, 1)
  processor.onaudioprocess = e => {
    if (!liveSession || muted) return
    const input = e.inputBuffer.getChannelData(0)
    e.outputBuffer.getChannelData(0).fill(0)
    const pcm = floatToPcm16(resampleMono(input, audioContext.sampleRate, 16000))
    if (!pcm.length) return
    liveSession.sendRealtimeInput({audio:{data:bytesToB64(pcm), mimeType:'audio/pcm;rate=16000'}})
  }
  source.connect(processor)
  processor.connect(audioContext.destination)
  $('micstatus').textContent = 'listening'
  $('micstatus').className = 'ok'
  setState('Listening','ok')
}

async function stopMicStreaming() {
  try { processor?.disconnect() } catch {}
  try { source?.disconnect() } catch {}
  micStream?.getTracks().forEach(t => t.stop())
  try { await audioContext?.close() } catch {}
  micStream = null; processor = null; source = null; audioContext = null
}

async function camera() {
  try { $('cam').srcObject = await navigator.mediaDevices.getUserMedia({video:true}) }
  catch { log('System','Camera permission not available.') }
}

async function connectAvatar(appId, apiKey) {
  $('avstatus').textContent = 'connecting'; $('avstatus').className = 'warn'; $('prog').style.width = '8%'
  const tr = await fetch('/api/spatius-token',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({apiKey})})
  const td = await tr.json()
  if (!tr.ok) throw new Error(typeof td.detail === 'string' ? td.detail : JSON.stringify(td.detail || td.error))

  if (!sdkReady) {
    await AvatarSDK.initialize(appId,{drivingServiceMode:DrivingServiceMode.direct,audioFormat:{channelCount:1,sampleRate:24000},logLevel:LogLevel.error})
    sdkReady = true
  }
  AvatarSDK.setSessionToken(td.sessionToken)
  $('prog').style.width = '20%'
  const av = await AvatarManager.shared.load('aed008e4-8ddf-41aa-b5b2-5d7321dd4165', info => {
    $('prog').style.width = `${Math.max(20,Math.round((info.progress||0)*75)+20)}%`
  })
  $('avatar').innerHTML=''
  avatarView = new AvatarView(av,$('avatar'))
  avatarController = avatarView.controller
  avatarView.onFirstRendering = () => {
    avatarReady = true; $('placeholder').style.display='none'; $('avstatus').textContent='ready'; $('avstatus').className='ok'; $('prog').style.width='100%'
  }
  avatarController.onConnectionState = state => {
    if (String(state)==='connected') { $('avstatus').textContent=avatarReady?'ready':'connected'; $('avstatus').className='ok' }
  }
  avatarController.onConversationState = state => {
    if (String(state).toLowerCase().includes('speaking')) setState('Speaking','ok')
  }
  avatarController.onError = e => {
    const msg=e?.message||String(e); log('Avatar',msg)
    if(!avatarReady){$('avstatus').textContent='error';$('avstatus').className='bad'}
  }
  await avatarController.initializeAudioContext()
  await avatarController.start()
}

async function connectGemini(apiKey) {
  setAIStatus('minting token','warn'); $('aihint').textContent='Creating a short-lived Gemini Live token…'
  const r=await fetch('/api/gemini-token',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({apiKey})})
  const data=await r.json()
  if(!r.ok) throw new Error(data.detail||data.error||'Could not create Gemini Live token')

  setAIStatus('connecting','warn')
  const ai=new GoogleGenAI({apiKey:data.token,httpOptions:{apiVersion:'v1beta'}})
  liveSession=await ai.live.connect({
    model:'gemini-3.8-live',
    config:{
      responseModalities:[Modality.AUDIO],
      systemInstruction:SYSTEM_PROMPT,
      inputAudioTranscription:{},
      outputAudioTranscription:{},
      speechConfig:{voiceConfig:{prebuiltVoiceConfig:{voiceName:'Aoede'}}},
      realtimeInputConfig:{automaticActivityDetection:{disabled:false,prefixPaddingMs:120,silenceDurationMs:750}}
    },
    callbacks:{
      onopen:()=>{aiReady=true;setAIStatus('live','ok');$('aihint').textContent='Gemini Live is listening and maintains the conversation context.'},
      onmessage:msg=>handleGeminiMessage(msg),
      onerror:e=>{setAIStatus('error','bad');$('aihint').textContent=e?.message||'Gemini Live error.';log('AI',e?.message||String(e))},
      onclose:e=>{aiReady=false;setAIStatus('closed','bad');$('aihint').textContent=e?.reason||'Gemini Live session closed.'}
    }
  })
}

function handleGeminiMessage(msg) {
  const content=msg.serverContent
  if(!content)return

  if(content.inputTranscription?.text){
    const t=content.inputTranscription.text.trim()
    if(t&&t!==lastUserTranscript){lastUserTranscript=t;caption('Walter',t);setState('Thinking','warn')}
  }
  if(content.outputTranscription?.text){
    const t=content.outputTranscription.text.trim()
    if(t){lastModelTranscript=t;$('who').textContent='Emma:';$('caption').textContent=t}
  }
  if(content.modelTurn?.parts){
    for(const part of content.modelTurn.parts){
      const audio=part.inlineData
      if(!audio?.data)continue
      const pcm=b64ToBytes(audio.data)
      if(!pcm.length)continue
      turnHadAudio=true;setState('Speaking','ok')
      if(avatarController&&avatarReady){
        avatarController.send(pcm.buffer.slice(pcm.byteOffset,pcm.byteOffset+pcm.byteLength),false)
      }else playPcm24k(pcm)
    }
  }
  if(content.interrupted){
    turnHadAudio=false
    try{avatarController?.interrupt()}catch{}
    setState('Listening','ok')
  }
  if(content.turnComplete){
    if(turnHadAudio&&avatarController&&avatarReady) avatarController.send(new ArrayBuffer(0),true)
    turnHadAudio=false
    if(lastModelTranscript){log('Emma',lastModelTranscript);lastModelTranscript=''}
    setState(muted?'Muted':'Listening',muted?'warn':'ok')
  }
}

let fallbackAudioCtx=null, playbackCursor=0
function playPcm24k(bytes){
  if(!fallbackAudioCtx)fallbackAudioCtx=new AudioContext({sampleRate:24000})
  const samples=new Float32Array(bytes.length/2),dv=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength)
  for(let i=0;i<samples.length;i++)samples[i]=dv.getInt16(i*2,true)/32768
  const buf=fallbackAudioCtx.createBuffer(1,samples.length,24000);buf.copyToChannel(samples,0)
  const src=fallbackAudioCtx.createBufferSource();src.buffer=buf;src.connect(fallbackAudioCtx.destination)
  const now=fallbackAudioCtx.currentTime;playbackCursor=Math.max(playbackCursor,now+0.03);src.start(playbackCursor);playbackCursor+=buf.duration
}

async function connectAll(){
  const appId=$('appid').value.trim(),spatiusKey=$('spatiuskey').value.trim(),geminiKey=$('geminikey').value.trim()
  if(!appId||!spatiusKey||!geminiKey){$('setupmsg').textContent='Complete all three fields.';return}
  $('connect').disabled=true;$('setupmsg').textContent='Connecting avatar and live AI…'
  try{
    localStorage.setItem('spatiusAppId',appId)
    await connectAvatar(appId,spatiusKey);$('spatiuskey').value=''
    await connectGemini(geminiKey);$('geminikey').value=''
    $('modal').classList.remove('show')
    caption('System','Avatar and Gemini Live are connected. Start the class when you are ready.')
  }catch(e){console.error(e);$('setupmsg').textContent=e?.message||String(e);log('System',`Connection failed: ${e?.message||e}`)}
  finally{$('connect').disabled=false}
}

async function startClass(){
  if(classStarted)return
  if(!avatarReady||!aiReady){$('appid').value=localStorage.getItem('spatiusAppId')||'';$('modal').classList.add('show');$('setupmsg').textContent='Connect the real avatar and Gemini Live first.';return}
  if(!(await enableMicrophonePermission()))return
  classStarted=true;$('live').textContent='Live';camera();await startMicStreaming()
  if(!timer)timer=setInterval(()=>{seconds++;$('timer').textContent=`${String(seconds/60|0).padStart(2,'0')}:${String(seconds%60).padStart(2,'0')}`},1000)
  liveSession.sendRealtimeInput({text:'Start the English lesson now. Greet Walter briefly and ask him one natural question about his workday.'})
}

async function endClass(){
  classStarted=false;clearInterval(timer);timer=null;await stopMicStreaming()
  try{liveSession?.close()}catch{};liveSession=null;aiReady=false
  try{avatarController?.close()}catch{}
  $('live').textContent='Ended';setAIStatus('closed','bad');setState('Ready');caption('System','Session ended.')
}

$('enable').onclick=enableMicrophonePermission
$('camera').onclick=camera
$('real').onclick=()=>{$('appid').value=localStorage.getItem('spatiusAppId')||'';$('modal').classList.add('show');$('setupmsg').textContent='Keys are used only to create short-lived sessions and are not saved by this page.'}
$('cancel').onclick=()=>{$('modal').classList.remove('show')}
$('connect').onclick=connectAll
$('start').onclick=startClass
$('mute').onclick=async()=>{muted=!muted;$('mute').textContent=muted?'🔇 Muted':'🎤 Mic';if(muted){await stopMicStreaming();$('micstatus').textContent='muted';$('micstatus').className='warn';setState('Muted','warn')}else await startMicStreaming()}
$('end').onclick=endClass

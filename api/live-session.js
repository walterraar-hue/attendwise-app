function buildInstructions(memory, todayStudySeconds){
  const studied = Math.floor((Number(todayStudySeconds)||0)/60)
  const recent = String(memory||'').slice(-6000)
  return `You are Emma, Walter's private AI English tutor. You are a warm, extroverted, patient, persistent North-American-English coach. Speak naturally, like a skilled human tutor in a live call.

Goal: Walter is around A1-A2. First make him solid B1; later advance toward C1. He prefers practical English for daily life and logistics/operations work. Today he has studied about ${studied} minutes.

Teaching behavior:
- Keep the conversation natural. React specifically to what Walter actually says; never fall into a generic repeated reply loop.
- Do not correct every tiny imperfection. Correct important grammar, vocabulary, meaning, fluency, or pronunciation errors that matter for progress.
- When an important mistake happens, interrupt politely and briefly. First quote the key wrong fragment. Then explain in simple Spanish WHY it is wrong. Give the correct form and explain WHY it is correct.
- Then make Walter repeat a SHORT fragment. Say exactly what he must repeat. He strongly prefers short repetitions.
- If you want the entire sentence, explicitly say in Spanish: "frase completa", then give the exact full sentence.
- Do not continue until the repetition is acceptable. If needed say, naturally: "Not yet. Slower. Again." and model it once more.
- After a successful repetition, test transfer with a different sentence or question so he proves he understood the rule.
- If Walter gets stuck, scaffold with one short phrase at a time, not a long paragraph.
- If he asks "why?", explain the rule clearly in Spanish with one useful example.
- If he switches to Spanish, answer briefly in Spanish when useful, then guide him back into English.
- For pronunciation, use the audio you actually hear. If you are uncertain, say so rather than inventing a pronunciation error.
- Ask one question at a time. Keep routine turns short enough for a live conversation.

Personality: encouraging but demanding, intelligent, coherent, emotionally natural, never patronizing. Use moderate backchannels while listening. Let Walter finish thoughts unless a correction is important. He may interrupt you at any time; stop naturally and listen.

Recent lesson context from this device (may be incomplete; use only to maintain continuity):
${recent || '[No prior transcript available yet.]'}

Start and continue as an English lesson, not as a generic assistant.`
}

export default async function handler(req,res){
  if(req.method!=='POST') return res.status(405).json({error:'method_not_allowed'})
  const apiKey=String(process.env.OPENAI_API_KEY||'').trim()
  if(!apiKey) return res.status(503).json({error:'openai_not_configured',detail:'OPENAI_API_KEY is missing on the server.'})
  try{
    const body=typeof req.body==='string'?JSON.parse(req.body||'{}'):(req.body||{})
    const sdp=String(body.sdp||'').trim()
    if(!sdp) return res.status(400).json({error:'missing_sdp'})

    const session={
      model:'gpt-live-1',
      instructions:buildInstructions(body.memory,body.todayStudySeconds),
      audio:{output:{voice:'gleam'}},
      client:{data_channel:{allowed_client_events:'all',allowed_server_events:'all'}},
      store:false
    }

    const upstream=await fetch('https://api.openai.com/v1/live/sessions',{
      method:'POST',
      headers:{
        'Authorization':`Bearer ${apiKey}`,
        'Content-Type':'application/json',
        'OpenAI-Safety-Identifier':'walter-private-english-tutor'
      },
      body:JSON.stringify({session,transport:{type:'webrtc',sdp}})
    })
    const data=await upstream.json().catch(()=>({}))
    if(!upstream.ok){
      return res.status(upstream.status).json({
        error:'openai_live_session_failed',
        detail:data?.error?.message||data?.message||`OpenAI returned ${upstream.status}`
      })
    }
    const answer=data?.transport?.sdp
    const sessionId=data?.session?.id
    if(!answer) return res.status(502).json({error:'missing_sdp_answer'})
    res.setHeader('Cache-Control','no-store')
    return res.status(201).json({sessionId,sdp:answer})
  }catch(e){
    return res.status(500).json({error:'live_session_exception',detail:e?.message||String(e)})
  }
}

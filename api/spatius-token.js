function pickToken(data){for(const k of ['sessionKey','sessionToken','token'])if(data?.[k])return data[k];for(const k of ['sessionKey','sessionToken','token'])if(data?.data?.[k])return data.data[k];return null}
export default async function handler(req,res){
  if(req.method!=='POST') return res.status(405).json({error:'method_not_allowed'})
  try{
    const body=typeof req.body==='string'?JSON.parse(req.body||'{}'):(req.body||{})
    const apiKey=String(body.apiKey||'').trim()
    if(!apiKey)return res.status(400).json({error:'missing_api_key'})
    const expireAt=Math.floor(Date.now()/1000)+55*60
    const r=await fetch('https://console.us-west.spatius.ai/v1/console/session-tokens',{method:'POST',headers:{'X-Api-Key':apiKey,'Content-Type':'application/json'},body:JSON.stringify({expireAt,modelVersion:''})})
    const raw=await r.text();let data={};try{data=JSON.parse(raw)}catch{data={raw}}
    if(!r.ok||data?.errors)return res.status(502).json({error:'session_token_request_failed',detail:data?.errors||data?.message||data?.error||raw.slice(0,400)})
    const sessionToken=pickToken(data);if(!sessionToken)return res.status(502).json({error:'session_token_missing'})
    res.setHeader('Cache-Control','no-store');return res.status(200).json({sessionToken,expiredAt:new Date(expireAt*1000).toISOString()})
  }catch(e){return res.status(500).json({error:'session_token_exception',detail:e?.message||String(e)})}
}

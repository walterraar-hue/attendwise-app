import { GoogleGenAI } from '@google/genai'

export default async function handler(req,res){
  if(req.method!=='POST') return res.status(405).json({error:'method_not_allowed'})
  try{
    const body=typeof req.body==='string'?JSON.parse(req.body||'{}'):(req.body||{})
    const apiKey=String(body.apiKey||'').trim()
    if(!apiKey) return res.status(400).json({error:'missing_gemini_api_key'})

    const ai=new GoogleGenAI({apiKey})
    const now=Date.now()
    const token=await ai.authTokens.create({
      config:{
        uses:1,
        expireTime:new Date(now+30*60*1000).toISOString(),
        newSessionExpireTime:new Date(now+60*1000).toISOString()
      }
    })
    if(!token?.name) return res.status(502).json({error:'gemini_token_missing'})
    res.setHeader('Cache-Control','no-store')
    return res.status(200).json({token:token.name,expiresInSeconds:1800})
  }catch(e){
    return res.status(500).json({error:'gemini_token_exception',detail:e?.message||String(e)})
  }
}

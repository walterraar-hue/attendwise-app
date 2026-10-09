export default function handler(req,res){
  if(req.method!=='GET') return res.status(405).json({error:'method_not_allowed'})
  res.setHeader('Cache-Control','no-store')
  return res.status(200).json({
    openaiConfigured:Boolean(process.env.OPENAI_API_KEY),
    model:'gpt-live-1',
    architecture:'openai-live-webrtc'
  })
}

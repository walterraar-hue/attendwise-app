export default function handler(req,res){
  if(req.method!=='GET') return res.status(405).json({error:'method_not_allowed'})
  res.setHeader('Cache-Control','no-store')
  return res.status(200).json({
    appId:String(process.env.SPATIUS_APP_ID||''),
    spatiusConfigured:Boolean(process.env.SPATIUS_API_KEY),
    geminiConfigured:Boolean(process.env.GEMINI_API_KEY)
  })
}

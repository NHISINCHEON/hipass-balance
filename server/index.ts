import {GET,POST} from './board';
interface Env { DB:D1Database; ALLOWED_ORIGINS:string }
export default {async fetch(request:Request,env:Env):Promise<Response>{
 const url=new URL(request.url);if(url.pathname!=='/api/board')return new Response('Not found',{status:404});
 const origin=request.headers.get('Origin')??'';
 const allowed=(env.ALLOWED_ORIGINS??'').split(',').map(s=>s.trim()).filter(Boolean);
 if(!origin||!allowed.includes(origin))return Response.json({error:'허용되지 않은 접속 주소입니다.'},{status:403});
 const cors={'Access-Control-Allow-Origin':origin,'Access-Control-Allow-Methods':'GET, POST, OPTIONS','Access-Control-Allow-Headers':'Content-Type','Vary':'Origin','Cache-Control':'no-store'};
 if(request.method==='OPTIONS')return new Response(null,{status:204,headers:cors});
 if(!['GET','POST'].includes(request.method))return new Response('Method not allowed',{status:405,headers:{...cors,Allow:'GET, POST, OPTIONS'}});
 if(request.method==='POST'&&!request.headers.get('Content-Type')?.startsWith('application/json'))return Response.json({error:'JSON 요청이 필요합니다.'},{status:415,headers:cors});
 const response=request.method==='GET'?await GET(env.DB):await POST(request,env.DB);
 const result=new Response(response.body,response);for(const [k,v]of Object.entries(cors))result.headers.set(k,v);return result;
}};

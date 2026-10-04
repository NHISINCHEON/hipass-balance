import { z } from 'zod';

const json=(body:unknown,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'no-store'}});
export async function GET(db:D1Database){try{
await db.batch([db.prepare("INSERT OR IGNORE INTO vehicles(id,name) SELECT 'initial-1','차량 1' WHERE NOT EXISTS(SELECT 1 FROM settings WHERE key='initialized')"),db.prepare("INSERT OR IGNORE INTO vehicles(id,name) SELECT 'initial-2','차량 2' WHERE NOT EXISTS(SELECT 1 FROM settings WHERE key='initialized')"),db.prepare("INSERT OR IGNORE INTO vehicles(id,name) SELECT 'initial-3','차량 3' WHERE NOT EXISTS(SELECT 1 FROM settings WHERE key='initialized')"),db.prepare("INSERT OR IGNORE INTO settings(key) VALUES('initialized')")]);
const [v,h]=await db.batch([db.prepare('SELECT * FROM vehicles WHERE deleted=0 ORDER BY rowid'),db.prepare('SELECT * FROM history ORDER BY time DESC,rowid DESC LIMIT 100')]);return json({vehicles:v.results,history:h.results});}catch(e){console.error(e);return json({error:'잔액을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.'},503)}}
export async function POST(req:Request,db:D1Database){try{const parsed=z.object({action:z.enum(['add','balance','rename','delete','reservation']),actor:z.string(),id:z.string().optional(),revision:z.number().int().optional(),name:z.string().optional(),balance:z.number().optional(),stage:z.enum(['before','after']).optional(),reservation:z.object({enabled:z.boolean(),date:z.string().optional(),name:z.string().optional()}).optional()}).safeParse(await req.json());if(!parsed.success)return json({error:'입력값을 확인해 주세요.'},400);const p=parsed.data;const actor=typeof p.actor==='string'?p.actor.trim():'';if(!actor||actor.length>30)return json({error:'입력자 이름을 1~30자로 입력해 주세요.'},400);if(!['add','balance','rename','delete','reservation'].includes(p.action))return json({error:'잘못된 작업입니다.'},400);const name=typeof p.name==='string'?p.name.trim():'';if(['add','rename'].includes(p.action)&&(!name||name.length>40))return json({error:'차량명을 1~40자로 입력해 주세요.'},400);if(p.action==='balance'&&(!Number.isSafeInteger(p.balance)||(p.balance??-1)<0||(p.balance??-1)>100000000))return json({error:'잔액은 0~100,000,000원의 정수로 입력해 주세요.'},400);
if(p.action==='balance'&&(!p.stage||p.balance!%1000!==0))return json({error:'출발 전 또는 도착 후를 선택하고 천원 단위로 입력해 주세요. 이전 화면이라면 새로고침해 주세요.'},400);
const id=p.action==='add'?crypto.randomUUID():p.id,token=crypto.randomUUID(),time=new Date().toISOString();if(typeof id!=='string')return json({error:'차량을 선택해 주세요.'},400);
let change;
if(p.action==='add')change=db.prepare('INSERT INTO vehicles(id,name,token) VALUES(?,?,?)').bind(id,name,token);
else{
 if(!Number.isSafeInteger(p.revision))return json({error:'새로고침 후 다시 입력해 주세요.'},400);
 const current=await db.prepare('SELECT balance,reservation_date,reservation_name FROM vehicles WHERE id=? AND revision=? AND deleted=0').bind(id,p.revision).first<{balance:number|null;reservation_date:string|null;reservation_name:string|null}>();
 if(!current)return json({error:'다른 사람이 먼저 수정했습니다. 최신 내용을 확인하고 다시 저장해 주세요.'},409);
 let rd=current.reservation_date,rn=current.reservation_name;
 if(p.action==='balance'||p.action==='reservation'){
  const effective=p.action==='balance'?p.balance:current.balance;
  if((p.action==='balance'&&effective!==null&&effective!==undefined&&effective>=60000)||p.reservation?.enabled===false){rd=null;rn=null;}
  else if(p.reservation?.enabled){
   rd=p.reservation.date??'';rn=p.reservation.name?.trim()??'';
   const validDate=/^\d{4}-\d{2}-\d{2}$/.test(rd)&&!Number.isNaN(Date.parse(rd+'T00:00:00Z'))&&new Date(rd+'T00:00:00Z').toISOString().slice(0,10)===rd;
   if(!validDate||!rn||rn.length>30)return json({error:'충전 예정일과 예약자 이름(1~30자)을 입력해 주세요.'},400);
   const today=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Seoul',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
   if(rd<today&&rd!==current.reservation_date)return json({error:'충전 예정일은 오늘 이후로 선택해 주세요.'},400);
  }
  if(p.action==='reservation'&&!p.reservation)return json({error:'예약 내용을 확인해 주세요.'},400);
 }
 const set=p.action==='balance'?'balance=?,actor=?,updated=?,stage=?,approximate=1,reservation_date=?,reservation_name=?':p.action==='reservation'?'reservation_date=?,reservation_name=?':p.action==='rename'?'name=?':'deleted=1';
 const vals=p.action==='balance'?[p.balance,actor,time,p.stage,rd,rn]:p.action==='reservation'?[rd,rn]:p.action==='rename'?[name]:[];
 change=db.prepare(`UPDATE vehicles SET ${set},revision=revision+1,token=? WHERE id=? AND revision=? AND deleted=0`).bind(...vals,token,id,p.revision);
}
const result=await db.batch([change,db.prepare('INSERT INTO history(id,vehicle,name,action,balance,actor,time,stage,approximate,reservation_date,reservation_name) SELECT ?,id,name,?,balance,?,?,stage,approximate,reservation_date,reservation_name FROM vehicles WHERE id=? AND token=?').bind(token,p.action,actor,time,id,token)]);if(!result[0].meta.changes)return json({error:'다른 사람이 먼저 수정했습니다. 최신 내용을 확인하고 다시 저장해 주세요.'},409);return json({ok:true});}catch(e){console.error(e);return json({error:'저장하지 못했습니다. 입력 내용을 확인하고 다시 시도해 주세요.'},503)}}

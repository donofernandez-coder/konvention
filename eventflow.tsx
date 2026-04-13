import{useState,useEffect,useRef,useCallback}from"react";
import{Users,CheckCircle,Clock,Wifi,WifiOff,Search,X,BarChart2,Settings,LogOut,Plus,Trash2,Edit3,Save,RefreshCw,Upload,Eye,EyeOff,ChevronDown,Download,AlertTriangle,Lock,Unlock,History}from"lucide-react";
import{PieChart,Pie,Cell,Tooltip,ResponsiveContainer}from"recharts";
import Papa from"papaparse";

const VER="1.6";
const SK="kv16";
const CREDS={admin:{u:"Adminkonvention",p:"YhR25*"},validator:{u:"intercatiafest",p:"vall333*"}};
const C={rose:"#ee2e5d",soft:"#fde8ed",light:"#fff0f3",text:"#2D3E4E",muted:"#6B7E8E",bg:"#F8F9FA",white:"#fff",bdr:"#E8ECF0",ok:"#00A86B",okBg:"#E8F8F2",warn:"#F59E0B",warnBg:"#FEF3C7",gray:"#9CA3AF",grayBg:"#F3F4F6"};
const PC=["#ee2e5d","#2D3E4E","#00A86B","#F59E0B","#8B5CF6","#06B6D4","#F97316","#EC4899","#14B8A6","#3B82F6"];
const IS={background:C.bg,border:`1.5px solid ${C.bdr}`,borderRadius:12,padding:"11px 14px",fontSize:14,color:C.text,width:"100%",boxSizing:"border-box"};

const IMS=[
  {id:"m1",label:"Kit de Bienvenida",datetime:"2026-04-17T09:00",extra:"kit"},
  {id:"m2",label:"Kick Off",datetime:"2026-04-17T20:00",extra:null},
  {id:"m3",label:"Cena Sábado",datetime:"2026-04-18T20:30",extra:"alergia"},
];
const DEMO=Array.from({length:8},(_,i)=>({id:`d${i}`,nombre:`Jugadora${i+1}`,apellido:"Demo",equipo:`Equipo ${["A","B","C"][i%3]}`,puesto:i%4===0?"Staff":"Jugadora",dni:`000000${i}Z`,hitosAsignados:{m1:true,m2:true,m3:i%3!==0}}));
const INIT=[
  {id:"e1",name:"INTERCATIA FEST 26",milestones:IMS,players:[],checkins:{},notes:{},history:[]},
  {id:"e2",name:"DEMO EVENT",milestones:IMS.map(m=>({...m})),players:DEMO,checkins:{},notes:{},history:[]},
];

const uid=()=>Math.random().toString(36).slice(2,9);
const lsG=()=>{try{const r=localStorage.getItem(SK);return r?JSON.parse(r):null;}catch{return null;}};
const lsS=d=>{try{localStorage.setItem(SK,JSON.stringify(d));}catch{}};
const norm=s=>String(s||"").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"");
const sid=p=>{const d=String(p.dni||"").trim().replace(/[\s-]/g,"").toUpperCase();return(d&&d!=="—")?`dni_${d}`:`nm_${norm(p.nombre)}_${norm(p.apellido)}`;};
const fmtCd=ms=>{if(ms<=0)return"Ahora";const h=Math.floor(ms/3600000),m=Math.floor((ms%3600000)/60000),s=Math.floor((ms%60000)/1000);return h>0?`${h}h ${m}m`:m>0?`${m}m ${s}s`:`${s}s`;};
const fmtT=ts=>ts?new Date(ts).toLocaleTimeString("es",{hour:"2-digit",minute:"2-digit",second:"2-digit"}):"—";
const gAct=(ms,now)=>[...ms].sort((a,b)=>+new Date(a.datetime)-+new Date(b.datetime)).reverse().find(m=>now>=new Date(m.datetime))||null;
const gNxt=(ms,now)=>[...ms].sort((a,b)=>+new Date(a.datetime)-+new Date(b.datetime)).find(m=>new Date(m.datetime)>now)||null;
const evSt=(ms,now)=>{if(!ms.length)return"empty";const t=ms.map(m=>new Date(m.datetime)).sort((a,b)=>a-b);const e=new Date(t[t.length-1].getTime()+108e5);if(now<t[0])return"waiting";if(now>e)return"finished";return"live";};
const evPct=(ms,now)=>{if(!ms.length)return 0;const t=ms.map(m=>new Date(m.datetime)).sort((a,b)=>a-b);const s=t[0],e=new Date(t[t.length-1].getTime()+108e5);if(now<=s)return 0;if(now>=e)return 100;return Math.round(((now-s)/(e-s))*100);};
const msRem=(ms,act,now)=>{if(!act)return null;const sr=[...ms].sort((a,b)=>+new Date(a.datetime)-+new Date(b.datetime));const i=sr.findIndex(m=>m.id===act.id);const e=i<sr.length-1?new Date(sr[i+1].datetime):new Date(+new Date(sr[i].datetime)+108e5);return e-now;};
const ini=p=>((p.nombre||"")[0]||"").toUpperCase()+((p.apellido||"")[0]||"").toUpperCase();
const sbFor=st=>({live:{label:"EN DIRECTO",color:C.ok,bg:C.okBg,dot:true},waiting:{label:"EN ESPERA",color:C.gray,bg:C.grayBg,dot:false},finished:{label:"FINALIZADO",color:"#dc2626",bg:"#fee2e2",dot:false},empty:{label:"SIN HITOS",color:C.gray,bg:C.grayBg,dot:false}}[st]||{label:"—",color:C.gray,bg:C.grayBg,dot:false});
function hApl(p,mid){if(!p?.hitosAsignados)return true;return!!p.hitosAsignados[mid];}

const FM={nombre:["nombre","name"],apellido:["apellido","apellidos","surname"],equipo:["equipo","team","club"],puesto:["puesto","role","cargo"],dni:["dni","nif","nie","id","pasaporte"]};
const SIV=new Set(["si","sí","s","1","yes","true"]);
const ff=(hs,cs)=>{for(const c of cs){const h=hs.find(h=>norm(h)===norm(c));if(h)return h;}for(const c of cs){const h=hs.find(h=>norm(h).includes(norm(c)));if(h)return h;}return null;};
const hCol=h=>{const n=norm(h);if(n.includes("kit"))return"m1";if(n.includes("kick"))return"m2";if(n.includes("cena"))return"m3";return null;};
const r2p=(row,hs)=>{
  const get=cs=>{const h=ff(hs,cs);return h?String(row[h]||"").trim():"";};
  const nombre=get(FM.nombre);if(!nombre)return null;
  const ha={};let hay=false;
  hs.forEach(h=>{const mid=hCol(h);if(mid){hay=true;ha[mid]=SIV.has(norm(String(row[h]||"").trim()));}});
  const p={nombre,apellido:get(FM.apellido),equipo:get(FM.equipo),puesto:get(FM.puesto)||"Jugadora",dni:get(FM.dni)||"—",hitosAsignados:hay?ha:null};
  p.id=sid(p);return p;
};
const parseC=text=>new Promise((res,rej)=>Papa.parse(text,{header:true,skipEmptyLines:true,dynamicTyping:false,delimitersToGuess:[",","\t",";","|"],complete:r=>res((r.data||[]).map(row=>r2p(row,r.meta.fields||[])).filter(Boolean)),error:rej}));
const dedup=pl=>{const s=new Set();return pl.filter(p=>{if(s.has(p.id))return false;s.add(p.id);return true;});};
const merge=(inc,oCi,oNt,oH)=>{const d=dedup(inc);const ci={},nt={};d.forEach(p=>{if(oCi[p.id])ci[p.id]=oCi[p.id];if(oNt[p.id])nt[p.id]=oNt[p.id];});return{players:d,checkins:ci,notes:nt,history:oH||[]};};

const doExport=(cur,hist)=>{
  if(!cur)return;
  const ms=cur.milestones,eqs=[...new Set(cur.players.map(p=>p.equipo))].sort();
  const rows=[
    ["Nombre","Apellido","Equipo","Puesto","DNI",...ms.map(m=>m.label),...ms.map(m=>`Hora ${m.label}`),"Notas Cena"].join(","),
    ...cur.players.map(p=>{const pc=cur.checkins[p.id]||{},nt=cur.notes||{};const times=ms.map(m=>{const h=(hist||[]).find(x=>x.pid===p.id&&x.mid===m.id&&x.action==="check");return h?fmtT(h.ts):"";});return[`"${p.nombre}"`,`"${p.apellido}"`,`"${p.equipo}"`,`"${p.puesto}"`,`"${p.dni}"`,...ms.map(m=>pc[m.id]?"SÍ":"NO"),...times.map(t=>`"${t}"`)  ,`"${nt[`${p.id}_m3`]||""}"`].join(",");}),
    "","=== RESUMEN POR EQUIPO ===",["Equipo","Total",...ms.map(m=>m.label)].join(","),
    ...eqs.map(eq=>{const ep=cur.players.filter(p=>p.equipo===eq);return[`"${eq}"`,ep.length,...ms.map(m=>ep.filter(p=>(cur.checkins[p.id]||{})[m.id]).length)].join(",");}),
  ].join("\n");
  const blob=new Blob(["\uFEFF"+rows],{type:"text/csv;charset=utf-8;"});
  const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download=`konvention_${new Date().toISOString().slice(0,10)}.csv`;a.click();URL.revokeObjectURL(url);
};

const CSS=`*{box-sizing:border-box;margin:0;padding:0;}body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;}
@keyframes blink{0%,100%{opacity:1}50%{opacity:.15}}@keyframes fup{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}@keyframes spin{to{transform:rotate(360deg)}}@keyframes fl{0%{background:#E8F8F2}50%{background:#00A86B22}100%{background:#fff}}
.cd{width:30px;height:30px;border-radius:50%;border:2px solid #E8ECF0;background:#fff;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all .15s;flex-shrink:0;user-select:none;-webkit-user-select:none;}
.cd.on{background:#ee2e5d;border-color:#ee2e5d;}.cd.no{background:#F3F4F6;border-color:#E8ECF0;cursor:default;opacity:.4;}.cd:hover:not(.no){border-color:#ee2e5d;}
.pr{background:#fff;border-bottom:1px solid #E8ECF0;padding:11px 14px;display:flex;align-items:center;gap:10px;cursor:pointer;transition:background .12s;}.pr:hover{background:#fff0f3;}.pr:last-child{border-bottom:none;}.pr.fl{animation:fl .5s ease;}
.nb{flex:1;display:flex;flex-direction:column;align-items:center;gap:3px;border:none;background:none;cursor:pointer;padding:10px 0 14px;font-size:11px;font-weight:500;color:#6B7E8E;}.nb.on{color:#ee2e5d;}
.ov{position:fixed;inset:0;background:rgba(0,0,0,.44);z-index:200;display:flex;align-items:flex-end;justify-content:center;}
.sh{background:#fff;border-radius:24px 24px 0 0;width:100%;max-width:680px;padding:22px;max-height:90vh;overflow-y:auto;animation:fup .2s ease;}
.br{border:none;background:#ee2e5d;color:#fff;border-radius:12px;padding:12px 20px;font-size:14px;font-weight:600;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px;width:100%;}.br:hover{background:#d41f4d;}.br:disabled{opacity:.6;cursor:not-allowed;}
.gh{border:1.5px solid #E8ECF0;background:none;color:#6B7E8E;border-radius:12px;padding:10px 16px;font-size:13px;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:6px;width:100%;}.gh:hover{border-color:#ee2e5d;color:#ee2e5d;}
select,input,textarea{background:#F8F9FA;border:1.5px solid #E8ECF0;border-radius:12px;padding:11px 14px;font-size:14px;color:#2D3E4E;width:100%;}select:focus,input:focus,textarea:focus{outline:none;border-color:#ee2e5d;}
.sp{width:16px;height:16px;border:2px solid rgba(255,255,255,.4);border-top-color:#fff;border-radius:50%;animation:spin .6s linear infinite;flex-shrink:0;}
::-webkit-scrollbar{width:4px;}::-webkit-scrollbar-thumb{background:#E8ECF0;border-radius:4px;}`;

function Ov({onClose,children}){return <div className="ov" onClick={onClose}><div className="sh" onClick={e=>e.stopPropagation()}>{children}</div></div>;}
function MH({title,onClose}){return <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}><span style={{fontSize:16,fontWeight:700}}>{title}</span><button onClick={onClose} style={{background:"none",border:"none",cursor:"pointer"}}><X size={19}/></button></div>;}
function Btn({col,children,...p}){return <button className="br" style={col?{background:col}:{}} {...p}>{children}</button>;}
function Card({children,mb}){return <div style={{background:C.white,borderRadius:14,border:`1px solid ${C.bdr}`,padding:14,marginBottom:mb||12}}>{children}</div>;}
function Badge({color,bg,dot,label}){return <span style={{fontSize:10,fontWeight:700,color,background:bg,borderRadius:12,padding:"3px 8px",display:"flex",alignItems:"center",gap:4}}>{dot&&<span style={{width:5,height:5,borderRadius:"50%",background:color,animation:"blink 1.2s infinite",display:"inline-block"}}/>}{label}</span>;}

function Login({onLogin}){
  const[u,setU]=useState("");
  const[p,setP]=useState("");
  const[sh,setSh]=useState(false);
  const[err,setErr]=useState("");
  const go=()=>{
    if(u===CREDS.admin.u&&p===CREDS.admin.p){onLogin("admin",u);return;}
    if(u===CREDS.validator.u&&p===CREDS.validator.p){onLogin("validator",u);return;}
    setErr("Usuario o contraseña incorrectos");
    setTimeout(()=>setErr(""),3000);
  };
  return <div style={{minHeight:"100vh",background:C.bg,display:"flex",alignItems:"center",justifyContent:"center",padding:24}}>
    <style>{CSS}</style>
    <div style={{background:C.white,borderRadius:24,border:`1px solid ${C.bdr}`,padding:36,width:"100%",maxWidth:380}}>
      <div style={{textAlign:"center",marginBottom:28}}>
        <div style={{fontSize:26,fontWeight:700,color:C.text}}>Konvention</div>
        <div style={{fontSize:13,color:C.muted,marginTop:4}}>powered by <span style={{color:C.rose,fontWeight:600}}>Konverxo</span></div>
        <div style={{fontSize:11,color:C.muted,marginTop:2}}>versión {VER}</div>
      </div>
      <label style={{fontSize:12,fontWeight:600,color:C.muted,display:"block",marginBottom:6}}>USUARIO</label>
      <input value={u} onChange={e=>{setU(e.target.value);setErr("");}} onKeyDown={e=>e.key==="Enter"&&go()} placeholder="Usuario" style={{...IS,marginBottom:12}}/>
      <label style={{fontSize:12,fontWeight:600,color:C.muted,display:"block",marginBottom:6}}>CONTRASEÑA</label>
      <div style={{position:"relative",marginBottom:14}}>
        <input type={sh?"text":"password"} value={p} onChange={e=>{setP(e.target.value);setErr("");}} onKeyDown={e=>e.key==="Enter"&&go()} placeholder="Contraseña" style={{...IS,paddingRight:42}}/>
        <button onClick={()=>setSh(!sh)} style={{position:"absolute",right:12,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",cursor:"pointer",color:C.muted}}>{sh?<EyeOff size={16}/>:<Eye size={16}/>}</button>
      </div>
      {err&&<div style={{fontSize:12,color:"#dc2626",background:"#fee2e2",borderRadius:8,padding:"8px 12px",marginBottom:12,textAlign:"center"}}>{err}</div>}
      <Btn onClick={go}>Entrar</Btn>
    </div>
  </div>;
}

export default function App(){
  const sv=lsG();
  const[role,setRole]=useState(null);
  const[uN,setUN]=useState("");
  const[evs,setEvs]=useState(sv?.events||INIT);
  const[aEv,setAEv]=useState(sv?.activeEv||"e1");
  const[online,setOnline]=useState(navigator.onLine);
  const[now,setNow]=useState(new Date());
  const[sim,setSim]=useState(false);
  const[simD,setSimD]=useState("2026-04-17");
  const[simT,setSimT]=useState("20:00");
  const[view,setView]=useState("checkin");
  const[q,setQ]=useState("");
  const[dniMode,setDniMode]=useState(false);
  const[fEq,setFEq]=useState("Todos");
  const[fH,setFH]=useState("Todos");
  const[fEst,setFEst]=useState("Todos");
  const[locked,setLocked]=useState(false);
  const[toast,setToast]=useState(null);
  const[tip,setTip]=useState(null);
  const[flashId,setFlashId]=useState(null);
  const[selP,setSelP]=useState(null);
  const[showHist,setShowHist]=useState(false);
  const[showNE,setShowNE]=useState(false);
  const[editEv,setEditEv]=useState(null);
  const[eMs,setEMs]=useState([]);
  const[nEn,setNEn]=useState("");
  const[nMl,setNMl]=useState("");
  const[nMd,setNMd]=useState("");
  const[imp,setImp]=useState(false);
  const[impInfo,setImpInfo]=useState(null);
  const[confOv,setConfOv]=useState(null);
  const[confRst,setConfRst]=useState(null);
  const fRef=useRef();
  const ptRef=useRef();
  const dRef=useRef();

  useEffect(()=>{if(sim)return;const iv=setInterval(()=>setNow(new Date()),1000);return()=>clearInterval(iv);},[sim]);
  useEffect(()=>{if(sim)setNow(new Date(`${simD}T${simT}:00`));},[sim,simD,simT]);
  useEffect(()=>{const on=()=>setOnline(true),off=()=>setOnline(false);window.addEventListener("online",on);window.addEventListener("offline",off);return()=>{window.removeEventListener("online",on);window.removeEventListener("offline",off);};},[]);
  useEffect(()=>{lsS({events:evs,activeEv:aEv});},[evs,aEv]);
  useEffect(()=>{if(dniMode&&dRef.current)dRef.current.focus();},[dniMode]);

  const t2=(msg,ok=true)=>{setToast({msg,ok});setTimeout(()=>setToast(null),2800);};
  const updEv=useCallback((id,patch)=>setEvs(ev=>ev.map(e=>e.id===id?{...e,...patch}:e)),[]);

  const cur=evs.find(e=>e.id===aEv)||evs[0]||null;
  const ms=cur?.milestones||[];
  const pl=cur?.players||[];
  const ci=cur?.checkins||{};
  const nt=cur?.notes||{};
  const hist=cur?.history||[];
  const msO=["m1","m2","m3"].map(id=>ms.find(m=>m.id===id)).filter(Boolean);
  const stat=cur?evSt(ms,now):"empty";
  const pct=cur?evPct(ms,now):0;
  const actM=cur?gAct(ms,now):null;
  const nxtM=cur?gNxt(ms,now):null;
  const rem=msRem(ms,actM,now);
  const asb=sbFor(stat);
  const tci=mid=>pl.filter(p=>hApl(p,mid)&&(ci[p.id]||{})[mid]).length;
  const totA=mid=>pl.filter(p=>hApl(p,mid)).length;
  const dCI=msO.reduce((a,m)=>({...a,[m.id]:tci(m.id)}),{});
  const eqs=["Todos",...[...new Set(pl.map(p=>p.equipo).filter(Boolean))].sort()];
  const HF=[{l:"Todos",v:"Todos"},{l:"Solo Kit",v:"m1"},{l:"Solo Kick Off",v:"m2"},{l:"Solo Cena",v:"m3"}];
  const hitoRef=fH!=="Todos"?fH:(actM?.id||null);
  const cntTodos=fH==="Todos"?pl.length:pl.filter(p=>hApl(p,fH)).length;
  const cntConf=hitoRef?tci(hitoRef):pl.filter(p=>msO.some(m=>hApl(p,m.id)&&(ci[p.id]||{})[m.id])).length;
  const cntPend=cntTodos-cntConf;

  const filtered=pl.filter(p=>{
    const ql=norm(q);
    const matchQ=!ql||norm(`${p.nombre} ${p.apellido}`).includes(ql)||norm(p.dni).includes(ql)||norm(p.equipo).includes(ql);
    const matchEq=fEq==="Todos"||p.equipo===fEq;
    const matchH=fH==="Todos"||hApl(p,fH);
    const isDone=hitoRef?(ci[p.id]||{})[hitoRef]:msO.some(m=>(ci[p.id]||{})[m.id]);
    const matchEst=fEst==="Todos"||(fEst==="Confirmados"&&isDone)||(fEst==="Pendientes"&&!isDone);
    return matchQ&&matchEq&&matchH&&matchEst;
  });

  const toggle=(pid,mid,e)=>{
    e?.preventDefault();e?.stopPropagation();if(!cur)return;
    const o=ci[pid]||{};const nx={...o,[mid]:!o[mid]};
    const nh=[...hist,{id:uid(),ts:Date.now(),pid,mid,action:nx[mid]?"check":"uncheck",user:uN}];
    const upd=evs.map(ev=>ev.id===cur.id?{...ev,checkins:{...ci,[pid]:nx},history:nh}:ev);
    setEvs(upd);lsS({events:upd,activeEv:aEv});
    const p=pl.find(x=>x.id===pid);
    if(nx[mid]){setFlashId(pid);setTimeout(()=>setFlashId(null),600);if(navigator.vibrate)navigator.vibrate(60);t2(`✓ ${p?.nombre} ${p?.apellido}`);}
    else t2(`Revertido: ${p?.nombre}`);
    if(selP?.id===pid)setSelP(s=>({...s,_t:Date.now()}));
  };

  const forceRst=mid=>{
    const upd=evs.map(e=>{
      if(e.id!==aEv)return e;
      const nc=mid==="all"?{}:Object.fromEntries(Object.entries({...e.checkins}).map(([pid,v])=>[pid,{...v,[mid]:false}]));
      return{...e,checkins:nc,notes:mid==="all"?{}:e.notes,history:[...(e.history||[]),{id:uid(),ts:Date.now(),action:"reset",mid,user:uN}]};
    });
    setEvs(upd);lsS({events:upd,activeEv:aEv});
    t2(`✓ Reset${mid!=="all"?` (${ms.find(m=>m.id===mid)?.label||mid})`:""}`);
  };

  const sp=(label,e)=>{e.preventDefault?.();ptRef.current=setTimeout(()=>{const r=e.currentTarget?.getBoundingClientRect();if(r)setTip({label,x:r.left+r.width/2,y:r.top-8});},500);};
  const ep=()=>{clearTimeout(ptRef.current);setTimeout(()=>setTip(null),1600);};

  const handleImp=async file=>{
    setImp(true);
    try{
      let text=await file.text();
      if(text.includes("Ã")||text.includes("â€")){const buf=await file.arrayBuffer();text=new TextDecoder("windows-1252").decode(buf);}
      const raw=await parseC(text);
      if(!raw.length){t2("Sin datos válidos",false);setImp(false);return;}
      const dd=dedup(raw);const dupes=raw.length-dd.length;
      if(Object.keys(ci).length>0)setConfOv({players:dd,count:raw.length,dupes});
      else applyImp(dd,raw.length,dupes);
    }catch{t2("Error al leer el archivo",false);}
    setImp(false);
  };
  const applyImp=(dd,total,dupes)=>{
    const{players:np,checkins:nc,notes:nn,history:nh}=merge(dd,ci,nt,hist);
    const upd=evs.map(e=>e.id===cur.id?{...e,players:np,checkins:nc,notes:nn,history:nh}:e);
    setEvs(upd);lsS({events:upd,activeEv:aEv});
    setImpInfo({count:np.length,dupes});
    t2(`✓ ${np.length} personas${dupes>0?` · ${dupes} duplicados`:""}`);
    setFEq("Todos");setFH("Todos");setFEst("Todos");
  };

  if(!role)return <Login onLogin={(r,u)=>{setRole(r);setUN(u);}}/>;

  if(locked)return <div style={{minHeight:"100vh",background:C.bg,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:20,padding:24}}>
    <style>{CSS}</style>
    <Lock size={48} color={C.rose}/>
    <div style={{fontSize:18,fontWeight:700}}>Pantalla bloqueada</div>
    <div style={{fontSize:13,color:C.muted,textAlign:"center"}}>Modo validador activo</div>
    <Btn style={{maxWidth:240}} onClick={()=>setLocked(false)}><Unlock size={16}/>Desbloquear</Btn>
  </div>;

  const eqSt=eqs.filter(e=>e!=="Todos").map(eq=>{
    const ep=pl.filter(p=>p.equipo===eq);
    const o={eq:eq.split(" ")[0],tot:ep.length};
    msO.forEach(m=>{o[m.id]=ep.filter(p=>hApl(p,m.id)&&(ci[p.id]||{})[m.id]).length;});
    return o;
  });

  return <div style={{background:C.bg,minHeight:"100vh",paddingBottom:72,color:C.text}}>
    <style>{CSS}</style>
    {sim&&<div style={{background:C.warnBg,borderBottom:`1px solid ${C.warn}`,padding:"6px 14px",display:"flex",alignItems:"center",gap:8,fontSize:12,fontWeight:600,color:"#92400e",position:"sticky",top:0,zIndex:120}}>
      <AlertTriangle size={14}/>SIMULACIÓN — {now.toLocaleDateString("es")} {now.toLocaleTimeString("es",{hour:"2-digit",minute:"2-digit"})}
      <button onClick={()=>setSim(false)} style={{marginLeft:"auto",background:"none",border:"none",cursor:"pointer",color:"#92400e",fontWeight:700}}>✕</button>
    </div>}
    {!online&&<div style={{background:"#fee2e2",borderBottom:"1px solid #fca5a5",padding:"6px 14px",display:"flex",alignItems:"center",gap:8,fontSize:12,fontWeight:600,color:"#dc2626"}}>
      <WifiOff size={14}/>SIN CONEXIÓN — datos guardados localmente
    </div>}

    <div style={{position:"sticky",top:0,zIndex:100,background:C.white,borderBottom:`1px solid ${C.bdr}`}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 14px 6px"}}>
        <div>
          <div style={{fontSize:15,fontWeight:700}}>Konvention <span style={{color:C.rose}}>·</span> {cur?.name||"—"}</div>
          <div style={{fontSize:10,color:C.muted}}>by <span style={{color:C.rose,fontWeight:600}}>Konverxo</span> · {uN} · v{VER}</div>
        </div>
        <div style={{display:"flex",gap:6,alignItems:"center"}}>
          {asb.dot&&<div style={{display:"flex",alignItems:"center",gap:5,background:C.okBg,borderRadius:20,padding:"4px 10px"}}>
            <span style={{width:6,height:6,borderRadius:"50%",background:C.ok,animation:"blink 1.2s infinite",display:"inline-block"}}/>
            <span style={{fontSize:10,fontWeight:700,color:C.ok}}>EN DIRECTO</span>
          </div>}
          <div style={{fontSize:10,fontWeight:600,color:online?C.ok:C.warn,background:online?C.okBg:C.warnBg,borderRadius:12,padding:"4px 8px",display:"flex",gap:3,alignItems:"center"}}>{online?<Wifi size={10}/>:<WifiOff size={10}/>}{online?"Online":"Local"}</div>
          <button title="Bloquear" onClick={()=>setLocked(true)} style={{background:"none",border:"none",cursor:"pointer",padding:4,color:C.muted}}><Lock size={15}/></button>
          <button onClick={()=>setRole(null)} style={{background:"none",border:"none",cursor:"pointer",padding:4,color:C.muted}}><LogOut size={15}/></button>
        </div>
      </div>
      {actM&&rem!=null&&<div style={{padding:"2px 14px 8px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <span style={{fontSize:12,fontWeight:700,color:C.rose}}>{actM.label} — quedan <span style={{color:C.text}}>{fmtCd(rem)}</span></span>
        {nxtM&&<span style={{fontSize:11,color:C.muted,display:"flex",alignItems:"center",gap:3}}><Clock size={10}/>{nxtM.label}: {fmtCd(new Date(nxtM.datetime)-now)}</span>}
      </div>}
      {!actM&&nxtM&&<div style={{padding:"2px 14px 8px"}}><span style={{fontSize:12,color:C.muted,display:"flex",alignItems:"center",gap:5}}><Clock size={12} color={C.rose}/><strong style={{color:C.rose}}>{fmtCd(new Date(nxtM.datetime)-now)}</strong> para {nxtM.label}</span></div>}
      <div style={{height:3,background:C.bdr}}><div style={{height:"100%",width:`${pct}%`,background:`linear-gradient(90deg,${C.rose},#ff6b8a)`,transition:"width 1s linear",borderRadius:"0 2px 2px 0"}}/></div>
    </div>

    {view==="checkin"&&<div style={{padding:14}}>
      {pl.length>0&&<div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8,marginBottom:14}}>
        {msO.map((m,i)=>{
          const c=tci(m.id),tot=totA(m.id),p2=tot>0?Math.round((c/tot)*100):0;
          const isAct=actM?.id===m.id;
          const cols=[C.rose,C.ok,"#8B5CF6"];
          return <div key={m.id} onClick={()=>{setFH(m.id);setFEst("Todos");}}
            style={{background:fH===m.id?C.light:C.white,borderRadius:14,border:`2px solid ${fH===m.id?C.rose:C.bdr}`,padding:"12px 10px",cursor:"pointer",transition:"all .15s",textAlign:"center"}}>
            {isAct&&<div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:4,marginBottom:4}}>
              <span style={{width:6,height:6,borderRadius:"50%",background:C.ok,animation:"blink 1.2s infinite",display:"inline-block"}}/>
              <span style={{fontSize:9,fontWeight:700,color:C.ok}}>EN CURSO</span>
            </div>}
            <div style={{fontSize:10,fontWeight:700,color:C.muted,marginBottom:4,lineHeight:1.2}}>{m.label}</div>
            <div style={{fontSize:28,fontWeight:700,color:cols[i%3],lineHeight:1}}>{c}</div>
            <div style={{fontSize:10,color:C.muted,marginBottom:6}}>de {tot}</div>
            <div style={{background:C.bg,borderRadius:6,height:5,overflow:"hidden"}}><div style={{height:"100%",width:`${p2}%`,background:cols[i%3],borderRadius:6,transition:"width .5s"}}/></div>
            <div style={{fontSize:10,fontWeight:600,color:tot-c>0?C.rose:C.ok,marginTop:4}}>{tot-c>0?`Faltan ${tot-c}`:"✓ Completo"}</div>
          </div>;
        })}
      </div>}
      {actM&&pl.length>0&&fH===actM.id&&<div style={{background:C.white,borderRadius:14,border:`1px solid ${C.bdr}`,padding:"14px 18px",marginBottom:14,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <div>
          <div style={{fontSize:11,color:C.muted,fontWeight:600,marginBottom:2}}>{actM.label} — EN CURSO</div>
          <div style={{fontSize:40,fontWeight:700,color:C.ok,lineHeight:1}}>{tci(actM.id)}<span style={{fontSize:18,color:C.muted,fontWeight:400}}>/{totA(actM.id)}</span></div>
          <div style={{fontSize:13,color:C.rose,fontWeight:700,marginTop:2}}>Faltan {totA(actM.id)-tci(actM.id)} por entrar</div>
        </div>
        <div style={{textAlign:"right"}}>{msO.filter(m=>m.id!==actM.id).map(m=><div key={m.id} style={{fontSize:11,color:C.muted,marginBottom:6}}>{m.label}<br/><strong style={{color:C.text,fontSize:14}}>{dCI[m.id]||0}/{totA(m.id)}</strong></div>)}</div>
      </div>}
      {pl.length>0&&<div style={{display:"flex",gap:8,marginBottom:14,overflowX:"auto"}}>
        {[{l:"Total",v:pl.length,c:C.rose},{l:"En recinto",v:actM?tci(actM.id):0,c:C.ok},{l:"Pendientes",v:actM?totA(actM.id)-tci(actM.id):pl.length,c:C.muted}].map((x,i)=>(
          <div key={i} style={{background:C.white,borderRadius:14,border:`1px solid ${C.bdr}`,padding:"10px 14px",minWidth:80,flexShrink:0,textAlign:"center"}}>
            <div style={{fontSize:20,fontWeight:700,color:x.c}}>{x.v}</div>
            <div style={{fontSize:10,color:C.muted,marginTop:1}}>{x.l}</div>
          </div>
        ))}
      </div>}
      {pl.length===0&&<div style={{background:C.white,borderRadius:16,border:`1.5px dashed ${C.bdr}`,padding:32,textAlign:"center",marginBottom:14}}>
        <Upload size={32} style={{color:C.rose,margin:"0 auto 12px",display:"block"}}/>
        <div style={{fontSize:15,fontWeight:600,marginBottom:6}}>Sin asistentes cargados</div>
        <div style={{fontSize:13,color:C.muted,marginBottom:16}}>Importa tu CSV desde el panel Admin</div>
        {role==="admin"&&<Btn onClick={()=>setView("config")}>Ir a importar</Btn>}
      </div>}
      {pl.length>0&&<>
        <div style={{display:"flex",gap:8,marginBottom:10}}>
          <div style={{position:"relative",flex:1}}>
            <Search size={15} style={{position:"absolute",left:13,top:"50%",transform:"translateY(-50%)",color:dniMode?C.rose:C.muted}}/>
            <input ref={dniMode?dRef:null} value={q} onChange={e=>setQ(e.target.value)} placeholder={dniMode?"Escanea o escribe DNI...":"Nombre, DNI o equipo..."} style={{...IS,paddingLeft:38,paddingRight:q?38:14,borderRadius:50,background:C.white,borderColor:dniMode?C.rose:C.bdr}}/>
            {q&&<button onClick={()=>setQ("")} style={{position:"absolute",right:11,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",cursor:"pointer",color:C.muted}}><X size={14}/></button>}
          </div>
          <button onClick={()=>{setDniMode(!dniMode);setQ("");}} style={{padding:"0 14px",borderRadius:12,border:`1.5px solid ${dniMode?C.rose:C.bdr}`,background:dniMode?C.soft:C.white,color:dniMode?C.rose:C.muted,cursor:"pointer",fontSize:12,fontWeight:600,flexShrink:0}}>DNI</button>
        </div>
        <div style={{display:"flex",gap:8,marginBottom:8}}>
          <div style={{flex:2,position:"relative"}}>
            <select value={fEq} onChange={e=>setFEq(e.target.value)} style={{...IS,appearance:"none",cursor:"pointer"}}>{eqs.map(e=><option key={e}>{e}</option>)}</select>
            <ChevronDown size={14} style={{position:"absolute",right:12,top:"50%",transform:"translateY(-50%)",color:C.muted,pointerEvents:"none"}}/>
          </div>
          <div style={{flex:1,position:"relative"}}>
            <select value={fH} onChange={e=>{setFH(e.target.value);setFEst("Todos");}} style={{...IS,appearance:"none",cursor:"pointer",fontSize:12}}>{HF.map(f=><option key={f.v} value={f.v}>{f.l}</option>)}</select>
            <ChevronDown size={13} style={{position:"absolute",right:10,top:"50%",transform:"translateY(-50%)",color:C.muted,pointerEvents:"none"}}/>
          </div>
        </div>
        <div style={{display:"flex",gap:6,marginBottom:12}}>
          {[{l:"Todos",v:"Todos",c:C.muted,cnt:cntTodos},{l:"Pendientes",v:"Pendientes",c:C.rose,cnt:cntPend},{l:"Confirmados",v:"Confirmados",c:C.ok,cnt:cntConf}].map(opt=>{
            const active=fEst===opt.v;
            return <button key={opt.v} onClick={()=>setFEst(opt.v)}
              style={{flex:1,padding:"8px 4px",borderRadius:10,border:`1.5px solid ${active?opt.c:C.bdr}`,background:active?(opt.v==="Confirmados"?C.okBg:opt.v==="Pendientes"?C.soft:C.grayBg):C.white,color:active?opt.c:C.muted,cursor:"pointer",fontSize:11,fontWeight:600,textAlign:"center",lineHeight:1.4}}>
              {opt.l}<br/><span style={{fontSize:16,fontWeight:700}}>{opt.cnt}</span>
            </button>;
          })}
        </div>
        {msO.length>0&&<div style={{background:C.white,borderRadius:"14px 14px 0 0",border:`1px solid ${C.bdr}`,borderBottom:"none"}}>
          <div style={{padding:"7px 14px",background:C.bg,borderBottom:`1px solid ${C.bdr}`,display:"flex",alignItems:"center",gap:10,borderRadius:"14px 14px 0 0"}}>
            <div style={{flex:1,fontSize:10,fontWeight:700,color:C.muted}}>
              {fEst!=="Todos"&&<span style={{color:fEst==="Confirmados"?C.ok:C.rose}}>{fEst.toUpperCase()}: </span>}
              {filtered.length} de {cntTodos}
            </div>
            <div style={{display:"flex",gap:8}}>{msO.map(m=><div key={m.id} style={{width:30,textAlign:"center",fontSize:9,fontWeight:700,color:fH===m.id?C.rose:C.muted}}>{m.id==="m1"?"KIT":m.id==="m2"?"KICK":"CENA"}</div>)}</div>
          </div>
        </div>}
        <div style={{background:C.white,borderRadius:msO.length>0?"0 0 14px 14px":"14px",border:`1px solid ${C.bdr}`,borderTop:msO.length>0?"none":undefined,overflow:"hidden"}}>
          {filtered.length===0&&<div style={{padding:24,textAlign:"center",color:C.muted,fontSize:13}}>
            {fEst==="Confirmados"?"Nadie confirmado aún":fEst==="Pendientes"?"¡Todos confirmados!":"Sin resultados"}
          </div>}
          {filtered.map(p=>{
            const pc=ci[p.id]||{};const noDni=!p.dni||p.dni==="—";
            const allDone=msO.filter(m=>hApl(p,m.id)).every(m=>pc[m.id]);
            const enRecinto=hitoRef&&pc[hitoRef]&&hApl(p,hitoRef);
            return <div key={p.id} className={`pr${flashId===p.id?" fl":""}`} onClick={()=>setSelP(p)}>
              <div style={{width:36,height:36,borderRadius:"50%",background:enRecinto?C.okBg:allDone?C.okBg:C.soft,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:700,color:enRecinto?C.ok:allDone?C.ok:C.rose,flexShrink:0,border:enRecinto?`2px solid ${C.ok}`:"2px solid transparent"}}>
                {ini(p)}
              </div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:13,fontWeight:600,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{p.nombre} {p.apellido}</div>
                <div style={{display:"flex",alignItems:"center",gap:5,marginTop:2,flexWrap:"wrap"}}>
                  <span style={{fontSize:10,color:C.muted,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:130}}>{p.equipo}</span>
                  {noDni&&<span style={{fontSize:9,background:C.warnBg,color:"#92400e",borderRadius:8,padding:"1px 5px",flexShrink:0}}>sin DNI</span>}
                  {enRecinto&&<span style={{fontSize:9,background:C.okBg,color:C.ok,borderRadius:8,padding:"1px 6px",fontWeight:700,flexShrink:0}}>✓ DENTRO</span>}
                  {!enRecinto&&hitoRef&&hApl(p,hitoRef)&&<span style={{fontSize:9,background:"#fee2e2",color:"#dc2626",borderRadius:8,padding:"1px 6px",fontWeight:600,flexShrink:0}}>Pendiente</span>}
                </div>
              </div>
              <div style={{display:"flex",gap:7,flexShrink:0}} onClick={e=>e.stopPropagation()}>
                {msO.map(m=>{const done=!!pc[m.id];const apl=hApl(p,m.id);
                  if(!apl)return <div key={m.id} className="cd no" style={{width:30,height:30}} title="No aplica"><X size={9} color={C.muted}/></div>;
                  return <button key={m.id} className={`cd${done?" on":""}`} style={{width:30,height:30}} onClick={e=>toggle(p.id,m.id,e)} onMouseDown={e=>sp(m.label,e)} onMouseUp={ep} onMouseLeave={ep} onTouchStart={e=>sp(m.label,e)} onTouchEnd={ep} onTouchCancel={ep}>{done&&<CheckCircle size={13} color="#fff"/>}</button>;
                })}
              </div>
            </div>;
          })}
        </div>
      </>}
    </div>}

    {view==="dashboard"&&<div style={{padding:14}}>
      {msO.map((m,i)=>{const c=tci(m.id),tot=totA(m.id),p2=tot>0?Math.round((c/tot)*100):0;return(
        <Card key={m.id}>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}><span style={{fontSize:14,fontWeight:600}}>{m.label}</span><span style={{fontSize:14,fontWeight:700,color:C.rose}}>{c}/{tot}</span></div>
          <div style={{background:C.bg,borderRadius:8,height:8,overflow:"hidden"}}><div style={{height:"100%",width:`${p2}%`,background:[C.rose,C.ok,"#8B5CF6"][i%3],borderRadius:8,transition:"width .5s"}}/></div>
          <div style={{fontSize:11,color:C.muted,marginTop:4}}>{p2}% · Faltan {tot-c}</div>
        </Card>
      );})}
      {eqSt.length>0&&<Card>
        <div style={{fontSize:13,fontWeight:600,marginBottom:10}}>Por equipo</div>
        <div style={{overflowX:"auto"}}>
          <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
            <thead><tr style={{borderBottom:`1px solid ${C.bdr}`}}>
              <th style={{textAlign:"left",padding:"4px 8px",color:C.muted,fontSize:11}}>Equipo</th>
              <th style={{textAlign:"center",padding:"4px 8px",color:C.muted,fontSize:11}}>Tot</th>
              {msO.map(m=><th key={m.id} style={{textAlign:"center",padding:"4px 8px",color:C.rose,fontSize:11}}>{m.id==="m1"?"Kit":m.id==="m2"?"Kick":"Cena"}</th>)}
            </tr></thead>
            <tbody>{eqSt.map((r,i)=><tr key={r.eq} style={{background:i%2===0?C.white:C.bg,borderBottom:`1px solid ${C.bdr}`}}>
              <td style={{padding:"6px 8px",fontWeight:500}}>{r.eq}</td>
              <td style={{padding:"6px 8px",textAlign:"center",color:C.muted}}>{r.tot}</td>
              {msO.map(m=><td key={m.id} style={{padding:"6px 8px",textAlign:"center",color:C.ok,fontWeight:600}}>{r[m.id]||0}</td>)}
            </tr>)}</tbody>
          </table>
        </div>
      </Card>}
      {pl.length>0&&<Card>
        <div style={{fontSize:13,fontWeight:600,marginBottom:8}}>Distribución</div>
        <ResponsiveContainer width="100%" height={200}>
          <PieChart><Pie data={[...new Set(pl.map(p=>p.equipo))].map(e=>({name:e,value:pl.filter(x=>x.equipo===e).length}))} cx="50%" cy="50%" outerRadius={75} dataKey="value" label={({name,percent})=>`${(name||"").split(" ")[0]} ${Math.round(percent*100)}%`} fontSize={9}>
            {[...new Set(pl.map(p=>p.equipo))].map((_,i)=><Cell key={i} fill={PC[i%PC.length]}/>)}
          </Pie><Tooltip/></PieChart>
        </ResponsiveContainer>
      </Card>}
      <button className="gh" style={{marginBottom:8}} onClick={()=>doExport(cur,hist)}><Download size={15}/>Exportar informe CSV</button>
      <button className="gh" onClick={()=>setShowHist(true)}><History size={15}/>Historial de cambios</button>
    </div>}

    {view==="config"&&<div style={{padding:14}}>
      {role==="admin"&&<>
        <Card>
          <div style={{fontSize:13,fontWeight:700,marginBottom:4}}>Importar asistentes</div>
          <div style={{fontSize:12,color:C.muted,marginBottom:12}}>Evento: <strong>{cur?.name}</strong></div>
          <input ref={fRef} type="file" accept=".csv,.tsv,.txt" style={{display:"none"}} onChange={async e=>{const f=e.target.files[0];if(f)await handleImp(f);e.target.value="";}}/>
          <Btn onClick={()=>fRef.current.click()} disabled={imp}>{imp?<><div className="sp"/>Procesando...</>:<><Upload size={16}/>Subir CSV</>}</Btn>
          {pl.length>0&&<div style={{marginTop:10,background:C.okBg,borderRadius:10,padding:"8px 12px",fontSize:12,color:C.ok,fontWeight:600}}>✓ {pl.length} personas{impInfo?.dupes>0&&<span style={{color:C.warn}}> · {impInfo.dupes} duplicados</span>}</div>}
          <details style={{marginTop:12}}>
            <summary style={{fontSize:12,fontWeight:600,color:C.rose,cursor:"pointer",listStyle:"none",display:"flex",alignItems:"center",gap:6}}><ChevronDown size={14}/>¿Cómo debe estar el archivo?</summary>
            <div style={{marginTop:10,background:C.bg,borderRadius:12,padding:14,fontSize:12}}>
              <div style={{fontWeight:700,marginBottom:8}}>Cabeceras exactas:</div>
              <div style={{background:C.white,borderRadius:8,padding:"8px 12px",fontFamily:"monospace",fontSize:11,marginBottom:10,overflowX:"auto",whiteSpace:"nowrap"}}>NOMBRE, APELLIDO, EQUIPO, PUESTO, DNI, KIT DE BIENVENIDA, KICK OFF, CENA SÁBADO</div>
              {[{i:"🎯",t:"KIT DE BIENVENIDA, KICK OFF, CENA SÁBADO: escribe SI o NO"},{i:"🪪",t:"DNI sin espacios ni guiones: 12345678A"},{i:"📁",t:"Google Sheets: Archivo → Descargar → CSV"},{i:"🏉",t:"EQUIPO exactamente igual en todas las filas del mismo equipo"}].map((r,i)=>(
                <div key={i} style={{display:"flex",gap:8,background:C.white,borderRadius:8,padding:"7px 10px",marginBottom:5,alignItems:"flex-start"}}>
                  <span style={{fontSize:13,flexShrink:0}}>{r.i}</span><span style={{fontSize:11,color:C.muted}}>{r.t}</span>
                </div>
              ))}
            </div>
          </details>
        </Card>
        <Card>
          <div style={{fontSize:12,fontWeight:700,color:C.muted,marginBottom:10}}>EVENTOS</div>
          {evs.map(ev=>{const s2=sbFor(evSt(ev.milestones,now));return(
            <div key={ev.id} onClick={()=>{setAEv(ev.id);setImpInfo(null);}} style={{background:aEv===ev.id?C.light:C.bg,borderRadius:12,border:`1.5px solid ${aEv===ev.id?C.rose:C.bdr}`,padding:12,marginBottom:8,cursor:"pointer",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div><div style={{fontSize:14,fontWeight:600}}>{ev.name}</div><div style={{fontSize:11,color:C.muted}}>{ev.milestones.length} hitos · {ev.players.length} personas</div></div>
              <div style={{display:"flex",gap:8,alignItems:"center"}}><Badge {...s2}/>
                <button onClick={e=>{e.stopPropagation();setEditEv(ev);setEMs(ev.milestones.map(m=>({...m})));}} style={{background:"none",border:"none",cursor:"pointer",color:C.muted,padding:4}}><Edit3 size={14}/></button>
              </div>
            </div>
          );})}
          <Btn onClick={()=>setShowNE(true)}><Plus size={15}/>Nuevo evento</Btn>
        </Card>
        <Card>
          <div style={{fontSize:12,fontWeight:700,color:C.muted,marginBottom:10}}>RESETEAR CHECK-INS</div>
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {msO.map(m=><button key={m.id} onClick={()=>setConfRst(m.id)} style={{width:"100%",padding:"10px 14px",borderRadius:12,border:`1.5px solid ${C.bdr}`,background:C.bg,color:C.text,cursor:"pointer",fontSize:13,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
              <span>Resetear: <strong>{m.label}</strong></span><span style={{fontSize:12,color:C.rose,fontWeight:700}}>{tci(m.id)} checks</span>
            </button>)}
            <button onClick={()=>setConfRst("all")} style={{width:"100%",padding:"12px 14px",borderRadius:12,border:"1.5px solid #fca5a5",background:"#fef2f2",color:"#dc2626",cursor:"pointer",fontSize:13,fontWeight:600,display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
              <RefreshCw size={14}/>Resetear TODOS los check-ins
            </button>
          </div>
        </Card>
        <Card>
          <div style={{fontSize:12,fontWeight:700,color:C.muted,marginBottom:10}}>SIMULACIÓN DE TIEMPO</div>
          <button onClick={()=>setSim(!sim)} style={{padding:"10px 18px",borderRadius:50,border:"none",background:sim?C.rose:C.bg,color:sim?"#fff":C.text,fontWeight:600,fontSize:13,cursor:"pointer",marginBottom:sim?10:0}}>{sim?"✓ Activa":"Activar simulación"}</button>
          {sim&&<div style={{display:"flex",gap:10}}>
            <div style={{flex:1}}><label style={{fontSize:11,color:C.muted,display:"block",marginBottom:4}}>Fecha</label><input type="date" value={simD} onChange={e=>setSimD(e.target.value)} style={IS}/></div>
            <div style={{flex:1}}><label style={{fontSize:11,color:C.muted,display:"block",marginBottom:4}}>Hora</label><input type="time" value={simT} onChange={e=>setSimT(e.target.value)} style={IS}/></div>
          </div>}
        </Card>
      </>}
      {role==="validator"&&<Card><div style={{textAlign:"center",padding:8}}>
        <div style={{fontSize:20,fontWeight:700,color:C.rose,marginBottom:8}}>{cur?.name||"—"}</div>
        <Badge {...asb}/>
        <div style={{marginTop:14,fontSize:12,color:C.muted}}>Validador · {uN}</div>
      </div></Card>}
    </div>}

    <div style={{position:"fixed",bottom:0,left:0,right:0,background:C.white,borderTop:`1px solid ${C.bdr}`,display:"flex",zIndex:100}}>
      {[{id:"checkin",icon:<Users size={20}/>,l:"Check-in"},{id:"dashboard",icon:<BarChart2 size={20}/>,l:"Análisis"},{id:"config",icon:<Settings size={20}/>,l:role==="admin"?"Admin":"Info"}].map(t=>(
        <button key={t.id} className={`nb ${view===t.id?"on":""}`} onClick={()=>setView(t.id)}>{t.icon}{t.l}{view===t.id&&<div style={{width:16,height:3,background:C.rose,borderRadius:2}}/>}</button>
      ))}
    </div>

    {confRst&&<Ov onClose={()=>setConfRst(null)}>
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:14}}><AlertTriangle size={22} color={C.warn}/><span style={{fontSize:16,fontWeight:700}}>Confirmar reset</span></div>
      <div style={{fontSize:13,color:C.muted,marginBottom:16,lineHeight:1.7}}>
        {confRst==="all"?<>Va a reiniciar <strong>TODOS</strong> los check-ins de <strong>{cur?.name}</strong>. No se puede deshacer.</>:<>Va a reiniciar únicamente <strong>{ms.find(m=>m.id===confRst)?.label}</strong>. El resto no se verá afectado.</>}
      </div>
      <div style={{display:"flex",gap:10}}>
        <button className="gh" onClick={()=>setConfRst(null)}>Cancelar</button>
        <Btn col="#dc2626" onClick={()=>{forceRst(confRst);setConfRst(null);}}><RefreshCw size={14}/>Sí, resetear</Btn>
      </div>
    </Ov>}

    {confOv&&<Ov onClose={()=>setConfOv(null)}>
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:14}}><AlertTriangle size={22} color={C.warn}/><span style={{fontSize:16,fontWeight:700}}>¿Sobrescribir asistentes?</span></div>
      <div style={{fontSize:13,color:C.muted,marginBottom:16,lineHeight:1.7}}>Hay check-ins registrados. Se importarán <strong>{confOv.count} personas</strong>{confOv.dupes>0&&<> ({confOv.dupes} duplicados eliminados)</>}. Los check-ins existentes <strong>se conservarán</strong>.</div>
      <div style={{display:"flex",gap:10}}>
        <button className="gh" onClick={()=>setConfOv(null)}>Cancelar</button>
        <Btn onClick={()=>{applyImp(confOv.players,confOv.count,confOv.dupes);setConfOv(null);}}>Sí, importar</Btn>
      </div>
    </Ov>}

    {showNE&&<Ov onClose={()=>setShowNE(false)}>
      <MH title="Nuevo evento" onClose={()=>setShowNE(false)}/>
      <input value={nEn} onChange={e=>setNEn(e.target.value)} placeholder="Nombre del evento" style={{...IS,marginBottom:14}}/>
      <Btn onClick={()=>{if(!nEn.trim())return;const ev={id:uid(),name:nEn,milestones:[],players:[],checkins:{},notes:{},history:[]};setEvs(p=>[...p,ev]);setAEv(ev.id);setShowNE(false);setNEn("");t2("Evento creado");}}>Crear evento</Btn>
    </Ov>}

    {editEv&&<Ov onClose={()=>setEditEv(null)}>
      <MH title={`Hitos: ${editEv.name}`} onClose={()=>setEditEv(null)}/>
      {eMs.map(m=><div key={m.id} style={{display:"flex",alignItems:"center",gap:8,marginBottom:7,background:C.bg,borderRadius:10,padding:"8px 12px"}}>
        <div style={{flex:1}}><div style={{fontSize:13,fontWeight:600}}>{m.label}</div><div style={{fontSize:11,color:C.muted}}>{m.datetime.replace("T"," · ")}</div></div>
        <button onClick={()=>setEMs(p=>p.filter(x=>x.id!==m.id))} style={{background:"none",border:"none",cursor:"pointer",color:"#dc2626"}}><Trash2 size={14}/></button>
      </div>)}
      <div style={{background:C.bg,borderRadius:12,padding:12,marginBottom:14}}>
        <input value={nMl} onChange={e=>setNMl(e.target.value)} placeholder="Nombre del hito" style={{...IS,marginBottom:8}}/>
        <input type="datetime-local" value={nMd} onChange={e=>setNMd(e.target.value)} style={{...IS,marginBottom:8}}/>
        <button className="gh" onClick={()=>{if(!nMl||!nMd)return;setEMs(p=>[...p,{id:uid(),label:nMl,datetime:nMd,extra:null}]);setNMl("");setNMd("");}}><Plus size={13}/>Añadir hito</button>
      </div>
      <Btn onClick={()=>{updEv(editEv.id,{milestones:eMs});setEditEv(null);t2("Hitos guardados");}}><Save size={13}/>Guardar hitos</Btn>
    </Ov>}

    {selP&&<Ov onClose={()=>setSelP(null)}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:18}}>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <div style={{width:52,height:52,borderRadius:"50%",background:C.soft,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,fontWeight:700,color:C.rose}}>{ini(selP)}</div>
          <div><div style={{fontSize:18,fontWeight:700}}>{selP.nombre} {selP.apellido}</div><div style={{fontSize:12,color:C.muted}}>{selP.equipo}</div></div>
        </div>
        <button onClick={()=>setSelP(null)} style={{background:C.bg,border:"none",borderRadius:"50%",width:34,height:34,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}><X size={16} color={C.muted}/></button>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:18}}>
        {[{l:"DNI/NIE",v:selP.dni},{l:"Puesto",v:selP.puesto},{l:"Equipo",v:selP.equipo}].map(f=>(
          <div key={f.l} style={{background:C.bg,borderRadius:12,padding:"10px 14px"}}><div style={{fontSize:10,color:C.muted,marginBottom:3,fontWeight:600}}>{f.l}</div><div style={{fontSize:13,fontWeight:600,wordBreak:"break-word"}}>{f.v||"—"}</div></div>
        ))}
      </div>
      <div style={{fontSize:11,fontWeight:700,color:C.muted,marginBottom:10}}>CHECK-INS — KIT · KICK OFF · CENA</div>
      {msO.map(m=>{
        const done=!!(ci[selP.id]||{})[m.id];const apl=hApl(selP,m.id);const nk=`${selP.id}_${m.id}`;
        const he=(hist||[]).filter(x=>x.pid===selP.id&&x.mid===m.id).slice(-1)[0];
        return <div key={m.id} style={{padding:"12px 0",borderBottom:`1px solid ${C.bdr}`}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
            <div>
              <div style={{fontSize:14,fontWeight:500}}>{m.label}</div>
              {he&&<div style={{fontSize:10,color:C.muted,marginTop:2}}>{he.action==="check"?"✓":"↩"} {fmtT(he.ts)} · {he.user}</div>}
              {!apl&&<div style={{fontSize:11,color:C.muted,marginTop:2}}>No asiste</div>}
            </div>
            {apl?<button onClick={e=>toggle(selP.id,m.id,e)} style={{padding:"8px 18px",borderRadius:10,border:"none",background:done?C.okBg:C.rose,color:done?C.ok:"#fff",fontSize:13,fontWeight:600,cursor:"pointer"}}>{done?"✓ Validado":"Check-in"}</button>
              :<span style={{fontSize:12,color:C.muted,padding:"8px 12px",background:C.bg,borderRadius:10}}>No asiste</span>}
          </div>
          {m.extra==="alergia"&&apl&&<textarea value={nt[nk]||""} onChange={e=>updEv(cur.id,{notes:{...nt,[nk]:e.target.value}})} placeholder="Alergias o dieta especial..." rows={2} style={{...IS,resize:"none",fontSize:12,marginTop:8}}/>}
        </div>;
      })}
    </Ov>}

    {showHist&&<Ov onClose={()=>setShowHist(false)}>
      <MH title="Historial de cambios" onClose={()=>setShowHist(false)}/>
      {hist.length===0&&<div style={{padding:24,textAlign:"center",color:C.muted}}>Sin cambios registrados aún</div>}
      {[...hist].reverse().slice(0,80).map(h=>{const p=pl.find(x=>x.id===h.pid);const m=ms.find(x=>x.id===h.mid);return(
        <div key={h.id} style={{display:"flex",alignItems:"flex-start",gap:10,padding:"8px 0",borderBottom:`1px solid ${C.bdr}`}}>
          <div style={{width:28,height:28,borderRadius:"50%",background:h.action==="check"?C.okBg:h.action==="uncheck"?C.warnBg:C.soft,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,marginTop:2}}>
            {h.action==="check"?<CheckCircle size={14} color={C.ok}/>:h.action==="uncheck"?<X size={14} color={C.warn}/>:<RefreshCw size={14} color={C.rose}/>}
          </div>
          <div style={{flex:1}}>
            <div style={{fontSize:12,fontWeight:600}}>{h.action==="reset"?`Reset: ${h.mid}`:`${p?.nombre||"?"} ${p?.apellido||""}`}</div>
            <div style={{fontSize:11,color:C.muted}}>{m?.label||h.mid} · {fmtT(h.ts)} · {h.user||"—"}</div>
          </div>
        </div>
      );})}
    </Ov>}

    {tip&&<div style={{position:"fixed",left:tip.x,top:tip.y,transform:"translate(-50%,-100%)",background:C.text,color:"#fff",fontSize:11,fontWeight:500,borderRadius:8,padding:"5px 10px",zIndex:500,whiteSpace:"nowrap",pointerEvents:"none",marginBottom:6}}>
      {tip.label}<div style={{position:"absolute",bottom:-5,left:"50%",transform:"translateX(-50%)",width:8,height:8,background:C.text,clipPath:"polygon(0 0,100% 0,50% 100%)"}}/>
    </div>}
    {toast&&<div style={{position:"fixed",bottom:80,left:"50%",transform:"translateX(-50%)",background:toast.ok?C.text:"#dc2626",color:"#fff",borderRadius:24,padding:"11px 22px",fontSize:13,fontWeight:500,zIndex:300,whiteSpace:"nowrap",animation:"fup .2s ease"}}>{toast.msg}</div>}
  </div>;
}

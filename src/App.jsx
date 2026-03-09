import { useState, useEffect } from "react";
import { supabase } from "./supabase.js";

const C = {
  ink:"#0A0A08",deep:"#060504",paper:"#F5F2EC",dim:"#EFEBE3",linen:"#E8E2D8",
  gold:"#B89A5A",goldL:"#D4B87A",goldDim:"rgba(184,154,90,0.13)",goldB:"rgba(184,154,90,0.35)",
  ivory:"#FAF8F4",stone:"#8C8070",sand:"#B5A898",
  green:"#4A7C59",greenDim:"rgba(74,124,89,0.13)",
  amber:"#C47B2B",amberDim:"rgba(196,123,43,0.13)",
  red:"#A63C3C",redDim:"rgba(166,60,60,0.13)",
};
const SF="'Playfair Display',Georgia,serif";
const SS="'DM Sans','Helvetica Neue',sans-serif";

const SECTORS=["Boulangerie","Coiffure","Garage","Restaurant","Auto-école","Pharmacie","Commerce","Beauté","Artisanat","Médecine"];
const MRR_HIST=[310,380,420,465,510,554];
const MRR_MONTHS=["Juil","Août","Sep","Oct","Nov","Déc"];

const getMrr=(subs,software)=>subs.reduce((s,id)=>{const sw=software.find(x=>x.id===id);return s+(sw?.price||0);},0);
const trialDaysLeft=(ts)=>ts?Math.max(0,Math.ceil((new Date(ts).getTime()+7*86400000-Date.now())/86400000)):0;
const isTrialActive=(ts)=>ts&&trialDaysLeft(ts)>0;

// ── Atoms ──────────────────────────────────────────────────────────────────
const HR=({s})=><div style={{height:1,background:`linear-gradient(90deg,transparent,${C.linen},transparent)`,...s}}/>;
const Stars=({r,sm})=>(
  <span style={{display:"inline-flex",gap:1,alignItems:"center"}}>
    {[1,2,3,4,5].map(i=><span key={i} style={{color:i<=Math.round(r)?C.gold:C.linen,fontSize:sm?11:13}}>★</span>)}
    <span style={{fontFamily:SS,fontSize:sm?10:12,color:C.stone,marginLeft:3}}>{r}</span>
  </span>
);
const Badge=({status})=>{
  const m={active:{l:"Actif",bg:C.greenDim,c:C.green},trial:{l:"Essai",bg:C.goldDim,c:C.gold},overdue:{l:"Retard",bg:C.redDim,c:C.red},paid:{l:"Payé",bg:C.greenDim,c:C.green},pending:{l:"En attente",bg:C.amberDim,c:C.amber},quoted:{l:"Devis envoyé",bg:C.goldDim,c:C.gold},cancelled:{l:"Annulé",bg:C.redDim,c:C.red}};
  const s=m[status]||m.active;
  return <span style={{background:s.bg,color:s.c,border:`1px solid ${s.c}44`,padding:"3px 10px",borderRadius:3,fontSize:10,fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",fontFamily:SS,whiteSpace:"nowrap"}}>{s.l}</span>;
};
const Mono=({i,size=36})=>(
  <div style={{width:size,height:size,borderRadius:4,background:C.ink,border:`1px solid ${C.gold}55`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:size*0.3,fontWeight:700,color:C.gold,fontFamily:SF,flexShrink:0}}>{i}</div>
);
const Btn=({children,v="primary",onClick,style:st={},disabled})=>{
  const vs={primary:{background:C.ink,color:C.ivory,border:"none"},ghost:{background:"transparent",color:C.stone,border:`1px solid ${C.linen}`},gold:{background:C.gold,color:C.ink,border:"none"},red:{background:C.redDim,color:C.red,border:`1px solid ${C.red}44`}};
  return <button onClick={disabled?undefined:onClick} style={{borderRadius:4,padding:"9px 20px",fontFamily:SS,fontSize:11,fontWeight:700,cursor:disabled?"not-allowed":"pointer",letterSpacing:"0.1em",textTransform:"uppercase",transition:"all 0.2s",opacity:disabled?0.5:1,...vs[v],...st}}>{children}</button>;
};
const KPI=({label,value,sub,accent,trend})=>(
  <div style={{background:C.paper,border:`1px solid ${C.linen}`,borderRadius:6,padding:"20px 24px"}}>
    <div style={{fontFamily:SS,fontSize:9,fontWeight:700,letterSpacing:"0.18em",textTransform:"uppercase",color:C.stone,marginBottom:8}}>{label}</div>
    <div style={{fontFamily:SF,fontSize:26,fontWeight:700,color:C.ink,lineHeight:1}}>{value}</div>
    {sub&&<div style={{fontFamily:SS,fontSize:11,color:accent?C.gold:trend?C.green:C.stone,marginTop:6}}>{trend&&<span style={{color:C.green}}>↑ </span>}{sub}</div>}
  </div>
);
const PH=({section,title,action})=>(
  <div style={{borderBottom:`1px solid ${C.linen}`,paddingBottom:18,marginBottom:26,display:"flex",justifyContent:"space-between",alignItems:"flex-end"}}>
    <div>
      <div style={{fontFamily:SS,fontSize:9,letterSpacing:"0.2em",textTransform:"uppercase",color:C.stone,marginBottom:4}}>{section}</div>
      <h1 style={{margin:0,fontFamily:SF,fontSize:30,fontWeight:700,color:C.ink}}>{title}</h1>
    </div>
    {action}
  </div>
);
const FL=({label})=><label style={{fontFamily:SS,fontSize:9,fontWeight:700,letterSpacing:"0.16em",textTransform:"uppercase",color:C.stone,display:"block",marginBottom:7}}>{label}</label>;
const TI=({label,value,onChange,type="text",placeholder="",mb=16})=>(
  <div style={{marginBottom:mb}}>
    {label&&<label style={{fontFamily:SS,fontSize:9,fontWeight:700,letterSpacing:"0.16em",textTransform:"uppercase",color:C.stone,display:"block",marginBottom:7}}>{label}</label>}
    <input type={type} value={value} onChange={onChange} placeholder={placeholder} style={{width:"100%",background:C.paper,border:`1px solid ${C.linen}`,borderRadius:4,padding:"11px 14px",fontFamily:SS,fontSize:13,color:C.ink,outline:"none",boxSizing:"border-box"}}/>
  </div>
);
const Overlay=({title,subtitle,onClose,children,wide})=>(
  <div style={{position:"fixed",inset:0,background:"rgba(5,5,4,0.7)",zIndex:300,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
    <div style={{background:C.ivory,border:`1px solid ${C.linen}`,borderRadius:10,padding:40,width:wide?600:420,maxHeight:"90vh",overflowY:"auto"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:subtitle?6:22}}>
        <div style={{fontFamily:SF,fontSize:20,fontWeight:700,color:C.ink}}>{title}</div>
        <button onClick={onClose} style={{background:"none",border:"none",color:C.stone,cursor:"pointer",fontSize:18}}>✕</button>
      </div>
      {subtitle&&<div style={{fontFamily:SS,fontSize:12,color:C.stone,marginBottom:22}}>{subtitle}</div>}
      {children}
    </div>
  </div>
);
const Toast=({msg,onClose})=>(
  <div style={{position:"fixed",bottom:26,right:26,background:C.ink,border:`1px solid ${C.gold}44`,borderRadius:8,padding:"16px 22px",zIndex:500,display:"flex",alignItems:"center",gap:12}}>
    <span style={{color:C.gold}}>✦</span>
    <span style={{fontFamily:SS,fontSize:13,color:C.ivory}}>{msg}</span>
    <button onClick={onClose} style={{background:"none",border:"none",color:C.stone,cursor:"pointer",marginLeft:8}}>✕</button>
  </div>
);
const Sparkline=({data})=>{
  const max=Math.max(...data),min=Math.min(...data),w=300,h=60,p=6;
  const x=(i)=>p+(i/(data.length-1))*(w-p*2);
  const y=(v)=>h-p-((v-min)/(max-min||1))*(h-p*2);
  const pts=data.map((v,i)=>`${x(i)},${y(v)}`).join(" ");
  const area=`M${x(0)},${y(data[0])} ${data.map((v,i)=>`L${x(i)},${y(v)}`).join(" ")} L${x(data.length-1)},${h} L${x(0)},${h} Z`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} style={{width:"100%",height:60}}>
      <defs><linearGradient id="g1" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={C.gold} stopOpacity="0.25"/><stop offset="100%" stopColor={C.gold} stopOpacity="0"/></linearGradient></defs>
      <path d={area} fill="url(#g1)"/>
      <polyline points={pts} fill="none" stroke={C.gold} strokeWidth="2" strokeLinejoin="round"/>
      {data.map((v,i)=>(
        <g key={i}>
          <circle cx={x(i)} cy={y(v)} r="3" fill={C.gold}/>
          <text x={x(i)} y={h} textAnchor="middle" style={{fontSize:8,fontFamily:SS,fill:C.stone}}>{MRR_MONTHS[i]}</text>
        </g>
      ))}
    </svg>
  );
};

// ── Auth Modal ─────────────────────────────────────────────────────────────
const AuthModal=({onLogin,initMode,onClose})=>{
  const [mode,setMode]=useState(initMode||"login");
  const [step,setStep]=useState(1);
  const [email,setEmail]=useState("");
  const [pass,setPass]=useState("");
  const [reg,setReg]=useState({company:"",name:"",email:"",sector:"",pass:"",pass2:""});
  const [err,setErr]=useState("");
  const [loading,setLoading]=useState(false);
  const is={width:"100%",background:"rgba(255,255,255,0.07)",border:"1px solid rgba(255,255,255,0.12)",borderRadius:4,padding:"12px 14px",fontFamily:SS,fontSize:13,color:C.ivory,outline:"none",boxSizing:"border-box"};
  const ls={fontFamily:SS,fontSize:9,fontWeight:700,letterSpacing:"0.16em",textTransform:"uppercase",color:"rgba(255,255,255,0.4)",display:"block",marginBottom:7};

  const doLogin=async()=>{
    setLoading(true);setErr("");
    const {data,error}=await supabase.auth.signInWithPassword({email,password:pass});
    if(error){setErr("Email ou mot de passe incorrect.");setLoading(false);return;}
    const {data:profile}=await supabase.from("profiles").select("*").eq("id",data.user.id).single();
    onLogin({...data.user,...profile});
    setLoading(false);
  };

  const doRegister=async()=>{
    if(!reg.company||!reg.email||!reg.pass){setErr("Remplissez tous les champs.");return;}
    if(reg.pass!==reg.pass2){setErr("Mots de passe différents.");return;}
    setLoading(true);setErr("");
    const {data,error}=await supabase.auth.signUp({
      email:reg.email,password:reg.pass,
      options:{data:{name:reg.name||reg.company}}
    });
    if(error){setErr(error.message);setLoading(false);return;}
    // Update profile with company info
    await supabase.from("profiles").update({
      company:reg.company,name:reg.name||reg.company,sector:reg.sector,
      avatar:reg.company.split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase(),
      status:"trial"
    }).eq("id",data.user.id);
    const {data:profile}=await supabase.from("profiles").select("*").eq("id",data.user.id).single();
    onLogin({...data.user,...profile},true);
    setLoading(false);
  };

  return (
    <div style={{position:"fixed",inset:0,background:"rgba(5,5,4,0.88)",zIndex:400,display:"flex",alignItems:"center",justifyContent:"center"}}>
      <div style={{background:C.deep,border:"1px solid rgba(255,255,255,0.08)",borderRadius:12,padding:"44px 48px",width:380,position:"relative"}}>
        <button onClick={onClose} style={{position:"absolute",top:16,right:20,background:"none",border:"none",color:"rgba(255,255,255,0.3)",cursor:"pointer",fontSize:18}}>✕</button>
        <div style={{fontFamily:SF,fontSize:22,fontWeight:700,color:C.ivory,letterSpacing:4,marginBottom:4}}>ONIQ</div>
        <div style={{height:1,width:36,background:C.gold,marginBottom:20}}/>
        <div style={{display:"flex",background:"rgba(255,255,255,0.04)",borderRadius:6,padding:4,marginBottom:24}}>
          {[["login","Connexion"],["register","Inscription"]].map(([k,l])=>(
            <button key={k} onClick={()=>{setMode(k);setStep(1);setErr("");}} style={{flex:1,padding:10,borderRadius:4,background:mode===k?"rgba(255,255,255,0.09)":"transparent",border:"none",color:mode===k?C.ivory:"rgba(255,255,255,0.33)",fontFamily:SS,fontSize:12,fontWeight:600,cursor:"pointer"}}>{l}</button>
          ))}
        </div>
        {mode==="login"&&(
          <>
            <div style={{marginBottom:12}}><label style={ls}>Email</label><input type="email" value={email} onChange={e=>setEmail(e.target.value)} onKeyDown={e=>e.key==="Enter"&&doLogin()} placeholder="vous@entreprise.fr" style={is}/></div>
            <div style={{marginBottom:18}}><label style={ls}>Mot de passe</label><input type="password" value={pass} onChange={e=>setPass(e.target.value)} onKeyDown={e=>e.key==="Enter"&&doLogin()} placeholder="••••••••" style={is}/></div>
            {err&&<div style={{fontFamily:SS,fontSize:12,color:"#e87777",marginBottom:12,background:"rgba(168,60,60,0.15)",padding:"10px 14px",borderRadius:4}}>{err}</div>}
            <button onClick={doLogin} disabled={loading} style={{width:"100%",background:C.gold,border:"none",borderRadius:4,padding:13,fontFamily:SS,fontSize:11,fontWeight:700,letterSpacing:"0.14em",textTransform:"uppercase",color:C.ink,cursor:"pointer",opacity:loading?0.7:1}}>{loading?"Connexion…":"Se connecter"}</button>
          </>
        )}
        {mode==="register"&&step===1&&(
          <>
            <div style={{fontFamily:SF,fontSize:14,color:C.ivory,marginBottom:16}}>Étape 1 / 2 — Votre entreprise</div>
            {[["Nom de l'entreprise","company","text"],["Votre nom","name","text"],["Email professionnel","email","email"]].map(([l,k,t])=>(
              <div key={k} style={{marginBottom:11}}><label style={ls}>{l}</label><input type={t} value={reg[k]} onChange={e=>setReg(p=>({...p,[k]:e.target.value}))} style={is}/></div>
            ))}
            <div style={{marginBottom:14}}>
              <label style={ls}>Secteur</label>
              <select value={reg.sector} onChange={e=>setReg(p=>({...p,sector:e.target.value}))} style={{...is,cursor:"pointer"}}>
                <option value="">Choisir…</option>{SECTORS.map(s=><option key={s}>{s}</option>)}
              </select>
            </div>
            <button onClick={()=>setStep(2)} style={{width:"100%",background:C.gold,border:"none",borderRadius:4,padding:13,fontFamily:SS,fontSize:11,fontWeight:700,color:C.ink,cursor:"pointer",letterSpacing:"0.14em",textTransform:"uppercase"}}>Continuer →</button>
          </>
        )}
        {mode==="register"&&step===2&&(
          <>
            <div style={{fontFamily:SF,fontSize:14,color:C.ivory,marginBottom:16}}>Étape 2 / 2 — Mot de passe</div>
            {[["Mot de passe","pass","password"],["Confirmer","pass2","password"]].map(([l,k,t])=>(
              <div key={k} style={{marginBottom:11}}><label style={ls}>{l}</label><input type={t} value={reg[k]} onChange={e=>setReg(p=>({...p,[k]:e.target.value}))} style={is}/></div>
            ))}
            {err&&<div style={{fontFamily:SS,fontSize:12,color:"#e87777",marginBottom:12,background:"rgba(168,60,60,0.15)",padding:"10px 14px",borderRadius:4}}>{err}</div>}
            <div style={{display:"flex",gap:10}}>
              <button onClick={()=>setStep(1)} style={{flex:1,background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:4,padding:13,fontFamily:SS,fontSize:11,color:"rgba(255,255,255,0.45)",cursor:"pointer",fontWeight:600}}>← Retour</button>
              <button onClick={doRegister} disabled={loading} style={{flex:2,background:C.gold,border:"none",borderRadius:4,padding:13,fontFamily:SS,fontSize:11,fontWeight:700,color:C.ink,cursor:"pointer",letterSpacing:"0.12em",textTransform:"uppercase",opacity:loading?0.7:1}}>{loading?"Création…":"Créer mon compte"}</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

// ── Marketplace ────────────────────────────────────────────────────────────
const Marketplace=({user,setUser,software,setView,onAuth})=>{
  const [cat,setCat]=useState("Tous");
  const [search,setSearch]=useState("");
  const [sort,setSort]=useState("popular");
  const [cart,setCart]=useState([]);
  const [detail,setDetail]=useState(null);
  const [showCart,setShowCart]=useState(false);
  const [showPay,setShowPay]=useState(false);
  const [toast,setToast]=useState(null);
  const [aiQ,setAiQ]=useState("");
  const [aiLoad,setAiLoad]=useState(false);
  const [aiRes,setAiRes]=useState(null);
  const [showAi,setShowAi]=useState(false);
  const [userSubs,setUserSubs]=useState([]);
  const [userTrials,setUserTrials]=useState({});

  useEffect(()=>{
    if(user?.id){
      supabase.from("subscriptions").select("software_id,status,trial_started_at").eq("user_id",user.id).then(({data})=>{
        if(data){
          setUserSubs(data.filter(s=>s.status==="active").map(s=>s.software_id));
          const trials={};
          data.filter(s=>s.status==="trial").forEach(s=>{trials[s.software_id]=s.trial_started_at;});
          setUserTrials(trials);
        }
      });
    }
  },[user?.id]);

  const CATS=["Tous",...Array.from(new Set(software.map(s=>s.cat)))];
  let list=software.filter(s=>(cat==="Tous"||s.cat===cat)&&s.name.toLowerCase().includes(search.toLowerCase()));
  if(sort==="popular")list=[...list].sort((a,b)=>b.reviews-a.reviews);
  if(sort==="rating")list=[...list].sort((a,b)=>b.rating-a.rating);
  if(sort==="price_asc")list=[...list].sort((a,b)=>a.price-b.price);
  if(sort==="price_desc")list=[...list].sort((a,b)=>b.price-a.price);

  const isSub=id=>userSubs.includes(id);
  const isTrial=id=>isTrialActive(userTrials[id]);
  const isCart=id=>cart.includes(id);

  const startTrial=async(id)=>{
    if(!user){onAuth("register");return;}
    await supabase.from("subscriptions").insert({user_id:user.id,software_id:id,status:"trial",trial_started_at:new Date().toISOString()});
    setUserTrials(p=>({...p,[id]:new Date().toISOString()}));
    const sw=software.find(s=>s.id===id);
    setToast(`✓ Essai 7 jours activé pour ${sw?.name} !`);
    setTimeout(()=>setToast(null),4000);
    setDetail(null);
  };

  const toggleCart=id=>{if(!user){onAuth("register");return;}setCart(p=>p.includes(id)?p.filter(x=>x!==id):[...p,id]);};
  const cartItems=software.filter(s=>cart.includes(s.id));
  const cartTotal=cartItems.reduce((s,x)=>s+x.price,0);

  const pay=async()=>{
    let ok=true;
    for(const id of cart){
      const {error}=await supabase.from("subscriptions").upsert({user_id:user.id,software_id:id,status:"active"},{onConflict:"user_id,software_id"});
      if(error){ok=false;console.error("Sub error:",error);}
    }
    if(!ok){setToast("❌ Erreur activation, réessayez");setTimeout(()=>setToast(null),5000);return;}
    const {data}=await supabase.from("subscriptions").select("software_id,status,trial_started_at").eq("user_id",user.id);
    if(data){
      setUserSubs(data.filter(s=>s.status==="active").map(s=>s.software_id));
      const trials={};
      data.filter(s=>s.status==="trial").forEach(s=>{trials[s.software_id]=s.trial_started_at;});
      setUserTrials(trials);
    }
    setCart([]);setShowPay(false);
    setToast("🎉 Abonnements activés !");setTimeout(()=>setToast(null),4000);
  };

  const runAi=async()=>{
    if(!user){onAuth("register");return;}
    if(!aiQ.trim())return;
    setAiLoad(true);setAiRes(null);
    try{
      const catalog=software.map(s=>`id:${s.id} ${s.name}(${s.price}€): ${s.description}`).join("\n");
      const res=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:400,messages:[{role:"user",content:`Catalogue:\n${catalog}\n\nBesoin: "${aiQ}"\n\nRéponds UNIQUEMENT en JSON:\n{"message":"réponse courte","matches":[{"id":1,"reason":"raison"}],"noMatch":false}`}]})});
      const data=await res.json();
      const txt=data.content?.map(b=>b.text||"").join("")||"{}";
      setAiRes(JSON.parse(txt.replace(/```json|```/g,"").trim()));
    }catch(e){setAiRes({message:"Une erreur est survenue.",matches:[],noMatch:true});}
    setAiLoad(false);
  };
  const aiMatches=aiRes?software.filter(s=>aiRes.matches?.some(m=>m.id===s.id)):[];

  return (
    <div style={{padding:"28px 36px"}}>
      <div style={{marginBottom:20}}>
        <div style={{fontFamily:SS,fontSize:9,letterSpacing:"0.2em",textTransform:"uppercase",color:C.stone,marginBottom:4}}>Catalogue</div>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-end"}}>
          <h1 style={{margin:0,fontFamily:SF,fontSize:30,fontWeight:700,color:C.ink}}>Marketplace</h1>
          <div style={{display:"flex",gap:8,alignItems:"center"}}>
            <button onClick={()=>{if(!user){onAuth("register");return;}setShowAi(p=>!p);}} style={{display:"flex",alignItems:"center",gap:7,background:showAi?C.goldDim:"transparent",border:`1px solid ${showAi?C.gold+"66":C.linen}`,borderRadius:6,padding:"8px 14px",fontFamily:SS,fontSize:11,fontWeight:600,color:showAi?C.gold:C.stone,cursor:"pointer"}}>
              <span>✦</span> Recherche IA{!user&&<span style={{fontSize:9,background:C.gold,color:C.ink,borderRadius:2,padding:"1px 5px",fontWeight:800,marginLeft:2}}>PRO</span>}
            </button>
            {user&&cart.length>0&&<button onClick={()=>setShowCart(true)} style={{background:C.gold,border:"none",borderRadius:6,padding:"8px 16px",fontFamily:SS,fontSize:11,fontWeight:700,color:C.ink,cursor:"pointer"}}>🛒 {cart.length} · {cartTotal}€/mois</button>}
            {!user&&<button onClick={()=>onAuth("register")} style={{background:C.gold,border:"none",borderRadius:6,padding:"8px 16px",fontFamily:SS,fontSize:11,fontWeight:800,color:C.ink,cursor:"pointer",letterSpacing:"0.08em",textTransform:"uppercase"}}>Créer un compte</button>}
          </div>
        </div>
      </div>
      {!user&&(
        <div style={{background:C.goldDim,border:`1px solid ${C.gold}44`,borderRadius:8,padding:"12px 18px",marginBottom:18,display:"flex",alignItems:"center",justifyContent:"space-between",gap:16}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}><span style={{color:C.gold}}>✦</span><span style={{fontFamily:SS,fontSize:12,color:C.ink}}>Créez un compte gratuit pour activer les <strong>essais 7 jours</strong>.</span></div>
          <div style={{display:"flex",gap:8,flexShrink:0}}>
            <button onClick={()=>onAuth("login")} style={{background:"transparent",border:`1px solid ${C.linen}`,borderRadius:4,padding:"6px 14px",fontFamily:SS,fontSize:11,fontWeight:600,color:C.stone,cursor:"pointer"}}>Connexion</button>
            <button onClick={()=>onAuth("register")} style={{background:C.ink,border:"none",borderRadius:4,padding:"6px 14px",fontFamily:SS,fontSize:11,fontWeight:700,color:C.ivory,cursor:"pointer",letterSpacing:"0.06em",textTransform:"uppercase"}}>S'inscrire</button>
          </div>
        </div>
      )}
      {showAi&&user&&(
        <div style={{background:C.paper,border:`1.5px solid ${C.gold}55`,borderRadius:10,padding:"18px 22px",marginBottom:18,position:"relative"}}>
          <div style={{position:"absolute",top:0,left:0,right:0,height:3,background:`linear-gradient(90deg,${C.gold},${C.goldL},transparent)`,borderRadius:"10px 10px 0 0"}}/>
          <div style={{fontFamily:SF,fontSize:14,fontWeight:700,color:C.ink,marginBottom:10}}>Décrivez votre besoin</div>
          <div style={{display:"flex",gap:10}}>
            <input value={aiQ} onChange={e=>setAiQ(e.target.value)} onKeyDown={e=>e.key==="Enter"&&runAi()} placeholder='Ex : "gérer mes rendez-vous et envoyer des rappels SMS"' style={{flex:1,background:C.ivory,border:`1px solid ${C.linen}`,borderRadius:6,padding:"10px 14px",fontFamily:SS,fontSize:13,color:C.ink,outline:"none"}}/>
            <button onClick={runAi} disabled={aiLoad||!aiQ.trim()} style={{background:C.ink,border:"none",borderRadius:6,padding:"10px 20px",fontFamily:SS,fontSize:11,fontWeight:700,color:C.ivory,cursor:"pointer",opacity:!aiQ.trim()?0.5:1,letterSpacing:"0.08em",textTransform:"uppercase",minWidth:100}}>{aiLoad?"…":"Chercher"}</button>
          </div>
          {aiRes&&(
            <div style={{marginTop:14,borderTop:`1px solid ${C.linen}`,paddingTop:12}}>
              <div style={{fontFamily:SS,fontSize:12,color:C.ink,marginBottom:aiMatches.length>0?12:0}}>✦ {aiRes.message}</div>
              {aiMatches.length>0&&(
                <div style={{display:"grid",gridTemplateColumns:`repeat(${Math.min(aiMatches.length,3)},1fr)`,gap:10}}>
                  {aiMatches.map(sw=>{const m=aiRes.matches.find(x=>x.id===sw.id);return(
                    <div key={sw.id} style={{background:C.ivory,border:`1px solid ${C.gold}44`,borderRadius:8,padding:"13px 15px"}}>
                      <div style={{display:"flex",alignItems:"center",gap:9,marginBottom:6}}><span style={{fontSize:18}}>{sw.icon}</span><div><div style={{fontFamily:SF,fontSize:13,fontWeight:700,color:C.ink}}>{sw.name}</div><div style={{fontFamily:SS,fontSize:10,color:C.gold,fontWeight:700}}>{sw.price}€/mois</div></div></div>
                      {m?.reason&&<div style={{fontFamily:SS,fontSize:11,color:C.stone,fontStyle:"italic",marginBottom:8}}>"{m.reason}"</div>}
                      {isSub(sw.id)||isTrial(sw.id)?<div style={{fontFamily:SS,fontSize:11,fontWeight:700,color:C.green}}>✓ {isSub(sw.id)?"Abonné":"Essai actif"}</div>:<button onClick={()=>startTrial(sw.id)} style={{width:"100%",background:C.goldDim,border:`1px solid ${C.gold}55`,borderRadius:4,padding:"6px",fontFamily:SS,fontSize:10,fontWeight:700,color:C.gold,cursor:"pointer",textTransform:"uppercase",letterSpacing:"0.07em"}}>Essayer 7j gratuit</button>}
                    </div>
                  );})}
                </div>
              )}
            </div>
          )}
        </div>
      )}
      <div style={{display:"flex",gap:8,marginBottom:16,alignItems:"center",flexWrap:"wrap"}}>
        <div style={{position:"relative",flex:1,minWidth:180}}>
          <span style={{position:"absolute",left:11,top:"50%",transform:"translateY(-50%)",color:C.sand}}>⌕</span>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Rechercher…" style={{width:"100%",background:C.paper,border:`1px solid ${C.linen}`,borderRadius:6,padding:"9px 12px 9px 30px",fontFamily:SS,fontSize:13,color:C.ink,outline:"none",boxSizing:"border-box"}}/>
        </div>
        <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
          {CATS.map(c=><button key={c} onClick={()=>setCat(c)} style={{background:cat===c?C.ink:"transparent",border:`1px solid ${cat===c?C.ink:C.linen}`,borderRadius:20,padding:"6px 13px",color:cat===c?C.ivory:C.stone,cursor:"pointer",fontFamily:SS,fontSize:11,fontWeight:600}}>{c}</button>)}
        </div>
        <select value={sort} onChange={e=>setSort(e.target.value)} style={{background:C.paper,border:`1px solid ${C.linen}`,borderRadius:6,padding:"8px 12px",fontFamily:SS,fontSize:12,color:C.ink,outline:"none",cursor:"pointer"}}>
          <option value="popular">Plus populaires</option><option value="rating">Mieux notés</option><option value="price_asc">Prix croissant</option><option value="price_desc">Prix décroissant</option>
        </select>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:14,marginBottom:22}}>
        {list.map(sw=>{
          const sub=isSub(sw.id),trial=isTrial(sw.id),inC=isCart(sw.id);
          return (
            <div key={sw.id} style={{background:C.paper,border:`1px solid ${sub?C.gold+"55":trial?C.green+"55":inC?C.ink+"33":C.linen}`,borderRadius:8,overflow:"hidden",display:"flex",flexDirection:"column",position:"relative",cursor:"pointer",transition:"transform 0.18s"}}
              onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-2px)";e.currentTarget.style.boxShadow="0 6px 20px rgba(0,0,0,0.07)";}}
              onMouseLeave={e=>{e.currentTarget.style.transform="translateY(0)";e.currentTarget.style.boxShadow="none";}}
            >
              {sw.popular&&!sub&&!trial&&<div style={{position:"absolute",top:10,right:10,background:C.gold,color:C.ink,fontSize:9,fontWeight:800,padding:"3px 7px",borderRadius:2,letterSpacing:"0.1em",textTransform:"uppercase"}}>Populaire</div>}
              {sub&&<div style={{position:"absolute",top:10,right:10,background:C.greenDim,color:C.green,fontSize:9,fontWeight:800,padding:"3px 7px",borderRadius:2,border:`1px solid ${C.green}44`}}>Abonné</div>}
              {trial&&!sub&&<div style={{position:"absolute",top:10,right:10,background:C.goldDim,color:C.gold,fontSize:9,fontWeight:700,padding:"3px 7px",borderRadius:2,border:`1px solid ${C.gold}44`}}>Essai · {trialDaysLeft(userTrials[sw.id])}j</div>}
              <div style={{padding:"16px 16px 0"}}>
                <div style={{fontSize:24,marginBottom:8}}>{sw.icon}</div>
                <div style={{fontFamily:SF,fontSize:13,fontWeight:700,color:C.ink,marginBottom:1}}>{sw.name}</div>
                <div style={{fontFamily:SS,fontSize:9,fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",color:C.stone,marginBottom:5}}>{sw.cat}</div>
                <Stars r={sw.rating} sm/><div style={{fontFamily:SS,fontSize:10,color:C.stone,marginTop:2,marginBottom:8}}>{sw.reviews} avis</div>
                <div style={{fontFamily:SS,fontSize:11,color:C.stone,lineHeight:1.5,marginBottom:10}}>{sw.description}</div>
              </div>
              <div style={{flex:1}}/>
              <div style={{padding:"0 16px 14px"}}>
                <HR s={{marginBottom:10}}/>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                  <span style={{fontFamily:SF,fontWeight:700,fontSize:15,color:C.ink}}>{sw.price}€<span style={{fontSize:10,fontWeight:400,color:C.stone}}>/mois</span></span>
                  <button onClick={()=>setDetail(sw)} style={{background:"none",border:"none",color:C.gold,cursor:"pointer",fontFamily:SS,fontSize:11,fontWeight:600,padding:0}}>Détails →</button>
                </div>
                {sub&&<div style={{textAlign:"center",fontFamily:SS,fontSize:11,fontWeight:700,color:C.green,padding:"6px 0"}}>✓ Abonné</div>}
                {!sub&&trial&&<button onClick={()=>toggleCart(sw.id)} style={{width:"100%",background:inC?C.ink:C.paper,border:`1px solid ${inC?C.ink:C.linen}`,borderRadius:4,padding:"7px",fontFamily:SS,fontSize:10,fontWeight:700,color:inC?C.ivory:C.ink,cursor:"pointer",textTransform:"uppercase",letterSpacing:"0.07em"}}>{inC?"✓ Dans le panier":"S'abonner"}</button>}
                {!sub&&!trial&&user&&(
                  <div style={{display:"flex",gap:6}}>
                    <button onClick={()=>startTrial(sw.id)} style={{flex:1,background:C.greenDim,border:`1px solid ${C.green}44`,borderRadius:4,padding:"7px",fontFamily:SS,fontSize:9,fontWeight:700,color:C.green,cursor:"pointer",textTransform:"uppercase",letterSpacing:"0.06em"}}>7j gratuit</button>
                    <button onClick={()=>toggleCart(sw.id)} style={{flex:1,background:inC?C.ink:C.paper,border:`1px solid ${inC?C.ink:C.linen}`,borderRadius:4,padding:"7px",fontFamily:SS,fontSize:9,fontWeight:700,color:inC?C.ivory:C.ink,cursor:"pointer",textTransform:"uppercase",letterSpacing:"0.06em"}}>{inC?"✓":"+ Ajouter"}</button>
                  </div>
                )}
                {!sub&&!trial&&!user&&<button onClick={()=>setDetail(sw)} style={{width:"100%",background:C.dim,border:`1px solid ${C.linen}`,borderRadius:4,padding:"7px",fontFamily:SS,fontSize:10,fontWeight:600,color:C.stone,cursor:"pointer",textTransform:"uppercase",letterSpacing:"0.07em"}}>Voir le logiciel</button>}
              </div>
            </div>
          );
        })}
      </div>
      <div style={{background:C.paper,border:`1px solid ${C.linen}`,borderRadius:8,padding:"20px 26px",display:"flex",alignItems:"center",justifyContent:"space-between",gap:20}}>
        <div><div style={{fontFamily:SF,fontSize:16,fontWeight:700,color:C.ink,marginBottom:3}}>Votre logiciel n'existe pas encore ?</div><div style={{fontFamily:SS,fontSize:12,color:C.stone}}>Développement sur mesure · Devis gratuit sous 48h</div></div>
        <button onClick={()=>user?setView("c-devis"):onAuth("register")} style={{background:C.ink,border:"none",borderRadius:6,padding:"10px 22px",fontFamily:SS,fontSize:11,fontWeight:800,letterSpacing:"0.1em",textTransform:"uppercase",color:C.ivory,cursor:"pointer",whiteSpace:"nowrap"}}>{user?"Demander un devis →":"Créer un compte →"}</button>
      </div>
      {detail&&(
        <div style={{position:"fixed",inset:0,background:"rgba(5,5,4,0.7)",zIndex:300,display:"flex",alignItems:"center",justifyContent:"center"}}>
          <div style={{background:C.ivory,border:`1px solid ${C.linen}`,borderRadius:10,padding:36,width:420,maxHeight:"90vh",overflowY:"auto"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:14}}><span style={{fontSize:32}}>{detail.icon}</span><button onClick={()=>setDetail(null)} style={{background:"none",border:"none",color:C.stone,cursor:"pointer",fontSize:18}}>✕</button></div>
            <div style={{fontFamily:SF,fontSize:18,fontWeight:700,color:C.ink,marginBottom:2}}>{detail.name}</div>
            <div style={{fontFamily:SS,fontSize:9,fontWeight:700,letterSpacing:"0.12em",textTransform:"uppercase",color:C.stone,marginBottom:9}}>{detail.cat}</div>
            <Stars r={detail.rating}/><div style={{fontFamily:SS,fontSize:11,color:C.stone,marginTop:3,marginBottom:13}}>{detail.reviews} avis</div>
            <div style={{fontFamily:SS,fontSize:13,color:C.stone,lineHeight:1.6,marginBottom:14}}>{detail.description}</div>
            <HR s={{marginBottom:14}}/>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
              <span style={{fontFamily:SF,fontWeight:700,fontSize:20,color:C.ink}}>{detail.price}€<span style={{fontSize:11,fontWeight:400,color:C.stone}}>/mois</span></span>
              {!user&&<button onClick={()=>onAuth("register")} style={{background:C.gold,border:"none",borderRadius:4,padding:"7px 14px",fontFamily:SS,fontSize:10,fontWeight:700,color:C.ink,cursor:"pointer",textTransform:"uppercase",letterSpacing:"0.07em"}}>Créer un compte</button>}
              {user&&!isSub(detail.id)&&!isTrial(detail.id)&&<button onClick={()=>startTrial(detail.id)} style={{background:C.greenDim,border:`1px solid ${C.green}44`,borderRadius:4,padding:"7px 14px",fontFamily:SS,fontSize:10,fontWeight:700,color:C.green,cursor:"pointer",textTransform:"uppercase",letterSpacing:"0.07em"}}>Essayer 7j gratuit</button>}
            </div>
          </div>
        </div>
      )}
      {showCart&&(
        <Overlay title="Mon panier" subtitle="Vos logiciels sélectionnés" onClose={()=>setShowCart(false)}>
          {cartItems.map((sw,i)=>(
            <div key={sw.id}><div style={{display:"flex",alignItems:"center",gap:12,padding:"12px 0"}}><span style={{fontSize:20}}>{sw.icon}</span><div style={{flex:1}}><div style={{fontFamily:SS,fontWeight:700,fontSize:13,color:C.ink}}>{sw.name}</div></div><span style={{fontFamily:SF,fontWeight:700,fontSize:14,color:C.ink}}>{sw.price}€/mois</span><button onClick={()=>toggleCart(sw.id)} style={{background:"none",border:"none",color:C.stone,cursor:"pointer"}}>✕</button></div>{i<cartItems.length-1&&<HR/>}</div>
          ))}
          <HR s={{margin:"12px 0"}}/>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:18}}><span style={{fontFamily:SS,fontSize:11,fontWeight:700,color:C.stone,textTransform:"uppercase"}}>Total mensuel</span><span style={{fontFamily:SF,fontWeight:700,fontSize:17,color:C.ink}}>{cartTotal} €</span></div>
          <div style={{display:"flex",gap:10}}>
            <button onClick={()=>setShowCart(false)} style={{flex:1,background:"transparent",border:`1px solid ${C.linen}`,borderRadius:4,padding:"9px",fontFamily:SS,fontSize:11,fontWeight:700,color:C.stone,cursor:"pointer",letterSpacing:"0.1em",textTransform:"uppercase"}}>Continuer</button>
            <button onClick={()=>{setShowCart(false);setShowPay(true);}} style={{flex:2,background:C.gold,border:"none",borderRadius:4,padding:"9px",fontFamily:SS,fontSize:11,fontWeight:700,color:C.ink,cursor:"pointer",letterSpacing:"0.1em",textTransform:"uppercase"}}>Passer au paiement</button>
          </div>
        </Overlay>
      )}
      {showPay&&(
        <Overlay title="Paiement" subtitle="Abonnement mensuel · résiliable à tout moment" onClose={()=>setShowPay(false)}>
          <div style={{background:C.dim,border:`1px solid ${C.linen}`,borderRadius:6,padding:13,marginBottom:14}}>
            {cartItems.map(sw=><div key={sw.id} style={{display:"flex",justifyContent:"space-between",padding:"3px 0",fontFamily:SS,fontSize:12}}><span>{sw.icon} {sw.name}</span><span style={{color:C.gold,fontWeight:700}}>{sw.price}€</span></div>)}
            <HR s={{margin:"9px 0"}}/>
            <div style={{display:"flex",justifyContent:"space-between"}}><span style={{fontFamily:SS,fontSize:10,fontWeight:700,color:C.stone,textTransform:"uppercase"}}>Total / mois</span><span style={{fontFamily:SF,fontWeight:700,fontSize:14,color:C.ink}}>{cartTotal} €</span></div>
          </div>
          <TI label="Numéro de carte" value="" onChange={()=>{}} placeholder="1234 5678 9012 3456"/>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}><TI label="Expiration" value="" onChange={()=>{}} placeholder="MM / AA"/><TI label="CVV" value="" onChange={()=>{}} placeholder="•••"/></div>
          <div style={{background:C.greenDim,border:`1px solid ${C.green}33`,borderRadius:4,padding:"8px 13px",marginBottom:14,fontFamily:SS,fontSize:11,color:C.green}}>🔒 Paiement sécurisé — Stripe (bientôt disponible)</div>
          <div style={{display:"flex",gap:10}}>
            <button onClick={()=>setShowPay(false)} style={{flex:1,background:"transparent",border:`1px solid ${C.linen}`,borderRadius:4,padding:"9px",fontFamily:SS,fontSize:11,fontWeight:700,color:C.stone,cursor:"pointer",letterSpacing:"0.1em",textTransform:"uppercase"}}>Annuler</button>
            <button onClick={pay} style={{flex:2,background:C.gold,border:"none",borderRadius:4,padding:"9px",fontFamily:SS,fontSize:11,fontWeight:700,color:C.ink,cursor:"pointer",letterSpacing:"0.1em",textTransform:"uppercase"}}>Confirmer · {cartTotal}€/mois</button>
          </div>
        </Overlay>
      )}
      {toast&&<Toast msg={toast} onClose={()=>setToast(null)}/>}
    </div>
  );
};

// ── Mon Espace ─────────────────────────────────────────────────────────────
const MonEspace=({user,software})=>{
  const [subs,setSubs]=useState([]);
  const [trials,setTrials]=useState([]);
  const [invoices,setInvoices]=useState([]);
  const [loading,setLoading]=useState(true);

  useEffect(()=>{
    if(!user?.id)return;
    Promise.all([
      supabase.from("subscriptions").select("*,software(*)").eq("user_id",user.id).eq("status","active"),
      supabase.from("subscriptions").select("*,software(*)").eq("user_id",user.id).eq("status","trial"),
      supabase.from("invoices").select("*").eq("user_id",user.id).order("created_at",{ascending:false}).limit(5),
    ]).then(([{data:s},{data:t},{data:inv}])=>{
      setSubs(s||[]);setTrials((t||[]).filter(x=>isTrialActive(x.trial_started_at)));setInvoices(inv||[]);setLoading(false);
    });
  },[user?.id]);

  const mrr=subs.reduce((s,x)=>s+(x.software?.price||0),0);

  if(loading)return <div style={{padding:"60px",textAlign:"center",fontFamily:SS,color:C.stone}}>Chargement…</div>;

  return (
    <div style={{padding:"28px 36px"}}>
      <div style={{marginBottom:22}}>
        <div style={{fontFamily:SS,fontSize:9,letterSpacing:"0.2em",textTransform:"uppercase",color:C.stone,marginBottom:4}}>Mon espace</div>
        <h1 style={{margin:0,fontFamily:SF,fontSize:30,fontWeight:700,color:C.ink}}>Bonjour, {user.company||user.name} 👋</h1>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:14,marginBottom:22}}>
        <KPI label="Abonnement mensuel" value={`${mrr} €`} sub={`${subs.length} logiciel${subs.length>1?"s":""} actif${subs.length>1?"s":""}`} accent/>
        <KPI label="Essais actifs" value={trials.length} sub={trials.length>0?trials.map(s=>s.software?.name).join(", "):"Aucun essai en cours"}/>
        <KPI label="Client depuis" value={user.since||new Date(user.created_at).toLocaleDateString("fr-FR",{month:"short",year:"numeric"})} sub="Membre ONIQ"/>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:18}}>
        <div style={{background:C.paper,border:`1px solid ${C.linen}`,borderRadius:6,overflow:"hidden"}}>
          <div style={{padding:"14px 18px",borderBottom:`1px solid ${C.linen}`}}><span style={{fontFamily:SF,fontSize:14,fontWeight:600,color:C.ink}}>Mes logiciels</span></div>
          {subs.length===0&&<div style={{padding:"22px 18px",fontFamily:SS,fontSize:13,color:C.stone,textAlign:"center"}}>Aucun logiciel souscrit.</div>}
          {subs.map((s,i)=>(
            <div key={s.id}><div style={{display:"flex",alignItems:"center",gap:12,padding:"12px 18px"}}>
              <div style={{width:34,height:34,borderRadius:6,background:C.goldDim,border:`1px solid ${C.goldB}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16}}>{s.software?.icon}</div>
              <div style={{flex:1}}><div style={{fontFamily:SS,fontWeight:700,fontSize:12,color:C.ink}}>{s.software?.name}</div><div style={{fontFamily:SS,fontSize:10,color:C.green,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.07em"}}>● Actif · {s.software?.price}€/mois</div></div>
            </div>{i<subs.length-1&&<HR s={{margin:"0 18px"}}/>}</div>
          ))}
          {trials.length>0&&(
            <>
              <div style={{padding:"9px 18px",background:C.goldDim,borderTop:`1px solid ${C.linen}`,fontFamily:SS,fontSize:9,fontWeight:700,letterSpacing:"0.14em",textTransform:"uppercase",color:C.gold}}>Essais en cours</div>
              {trials.map((s,i)=>(
                <div key={s.id}><div style={{display:"flex",alignItems:"center",gap:12,padding:"11px 18px"}}>
                  <div style={{width:34,height:34,borderRadius:6,background:C.goldDim,border:`1px solid ${C.goldB}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16}}>{s.software?.icon}</div>
                  <div style={{flex:1}}><div style={{fontFamily:SS,fontWeight:700,fontSize:12,color:C.ink}}>{s.software?.name}</div><div style={{fontFamily:SS,fontSize:10,color:C.gold,fontWeight:700,marginTop:2}}>{trialDaysLeft(s.trial_started_at)} jours restants</div></div>
                </div>{i<trials.length-1&&<HR s={{margin:"0 18px"}}/>}</div>
              ))}
            </>
          )}
          <div style={{padding:"11px 18px",borderTop:`1px solid ${C.linen}`,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <span style={{fontFamily:SS,fontSize:10,fontWeight:700,color:C.stone,textTransform:"uppercase",letterSpacing:"0.08em"}}>Total mensuel</span>
            <span style={{fontFamily:SF,fontWeight:700,fontSize:15,color:C.ink}}>{mrr} €</span>
          </div>
        </div>
        <div style={{background:C.paper,border:`1px solid ${C.linen}`,borderRadius:6,overflow:"hidden"}}>
          <div style={{padding:"14px 18px",borderBottom:`1px solid ${C.linen}`}}><span style={{fontFamily:SF,fontSize:14,fontWeight:600,color:C.ink}}>Mes factures</span></div>
          {invoices.length===0&&<div style={{padding:"22px 18px",fontFamily:SS,fontSize:13,color:C.stone,textAlign:"center"}}>Aucune facture pour le moment.</div>}
          {invoices.map((inv,i)=>(
            <div key={inv.id}><div style={{display:"flex",alignItems:"center",gap:10,padding:"12px 18px"}}>
              <div style={{flex:1}}><div style={{fontFamily:SS,fontSize:12,fontWeight:600,color:C.ink}}>{inv.invoice_number||`INV-${inv.id}`}</div><div style={{fontFamily:SS,fontSize:10,color:C.stone,marginTop:2}}>{new Date(inv.created_at).toLocaleDateString("fr-FR")}</div></div>
              <span style={{fontFamily:SF,fontWeight:700,fontSize:13,color:C.ink,marginRight:10}}>{inv.amount} €</span>
              <Badge status={inv.status}/>
            </div>{i<invoices.length-1&&<HR s={{margin:"0 18px"}}/>}</div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ── Parrainage ─────────────────────────────────────────────────────────────
const Parrainage=({user})=>{
  const [copied,setCopied]=useState(false);
  return (
    <div style={{padding:"28px 36px"}}>
      <PH section="Avantages" title="Programme de parrainage"/>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:20}}>
        <KPI label="Parrainages effectués" value={user.referrals||0} sub="clients référencés" trend/>
        <KPI label="Mois offerts" value={user.referral_credit||0} sub="crédits accumulés" accent/>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:18}}>
        <div style={{background:C.paper,border:`1px solid ${C.linen}`,borderRadius:8,padding:24}}>
          <div style={{fontFamily:SF,fontSize:15,fontWeight:700,color:C.ink,marginBottom:12}}>Votre lien de parrainage</div>
          <div style={{background:C.goldDim,border:`1px solid ${C.goldB}`,borderRadius:6,padding:"12px 16px",fontFamily:SS,fontWeight:700,fontSize:14,color:C.gold,letterSpacing:"0.1em",marginBottom:11}}>oniq.fr/ref/{user.referral_code}</div>
          <button onClick={()=>{navigator.clipboard?.writeText(`https://oniq.fr/ref/${user.referral_code}`);setCopied(true);setTimeout(()=>setCopied(false),2500);}} style={{width:"100%",background:copied?C.greenDim:C.ink,border:`1px solid ${copied?C.green+"44":"transparent"}`,borderRadius:4,padding:"10px",fontFamily:SS,fontSize:11,fontWeight:700,letterSpacing:"0.12em",textTransform:"uppercase",color:copied?C.green:C.ivory,cursor:"pointer",transition:"all 0.3s"}}>{copied?"✓ Lien copié !":"Copier le lien"}</button>
        </div>
        <div style={{background:C.ink,borderRadius:8,padding:24}}>
          <div style={{fontFamily:SF,fontSize:15,fontWeight:600,color:C.ivory,marginBottom:14}}>Comment ça marche ?</div>
          {[["Partagez votre lien","Envoyez-le à vos confrères."],["Ils s'inscrivent","Avec votre code unique."],["1 mois offert","Pour vous deux à chaque parrainage."],["Sans limite","Parrainez autant que vous voulez !"]].map(([t,d],i)=>(
            <div key={t} style={{display:"flex",gap:12,marginBottom:13}}>
              <div style={{width:22,height:22,borderRadius:"50%",background:C.gold,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:800,color:C.ink,flexShrink:0}}>{i+1}</div>
              <div><div style={{fontFamily:SS,fontSize:12,fontWeight:700,color:C.ivory,marginBottom:2}}>{t}</div><div style={{fontFamily:SS,fontSize:11,color:"rgba(255,255,255,0.4)",lineHeight:1.5}}>{d}</div></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ── Devis Client ───────────────────────────────────────────────────────────
const DevisClient=({user})=>{
  const [form,setForm]=useState({desc:"",budget:""});
  const [sent,setSent]=useState(false);
  const [loading,setLoading]=useState(false);

  const submit=async()=>{
    if(!form.desc)return;
    setLoading(true);
    await supabase.from("devis").insert({
      user_id:user.id,client_name:user.company||user.name,
      client_email:user.email,description:form.desc,budget:form.budget,status:"pending"
    });
    setSent(true);setLoading(false);
  };

  return (
    <div style={{padding:"28px 36px"}}>
      <PH section="Sur mesure" title="Demande de devis"/>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:28}}>
        <div>
          {sent?(
            <div style={{background:C.paper,border:`1px solid ${C.linen}`,borderRadius:8,padding:40,textAlign:"center"}}>
              <div style={{fontFamily:SF,fontSize:32,color:C.gold,marginBottom:10}}>✦</div>
              <div style={{fontFamily:SF,fontSize:18,fontWeight:700,color:C.ink,marginBottom:6}}>Demande envoyée !</div>
              <div style={{fontFamily:SS,fontSize:13,color:C.stone,marginBottom:20}}>Réponse sous 48h à <strong>{user.email}</strong>.</div>
              <button onClick={()=>setSent(false)} style={{background:"transparent",border:`1px solid ${C.linen}`,borderRadius:4,padding:"9px 20px",fontFamily:SS,fontSize:11,fontWeight:700,color:C.stone,cursor:"pointer",textTransform:"uppercase",letterSpacing:"0.1em"}}>Nouvelle demande</button>
            </div>
          ):(
            <div style={{background:C.paper,border:`1px solid ${C.linen}`,borderRadius:8,padding:26}}>
              <div style={{marginBottom:14}}>
                <FL label="Décrivez votre besoin"/>
                <textarea value={form.desc} onChange={e=>setForm(p=>({...p,desc:e.target.value}))} rows={5} placeholder="Ex: Je gère un pressing. J'ai besoin de suivre les articles en lavage…" style={{width:"100%",background:C.dim,border:`1px solid ${C.linen}`,borderRadius:4,padding:"11px 14px",fontFamily:SS,fontSize:13,color:C.ink,outline:"none",boxSizing:"border-box",resize:"vertical"}}/>
              </div>
              <div style={{marginBottom:14}}>
                <FL label="Budget estimé"/>
                <select value={form.budget} onChange={e=>setForm(p=>({...p,budget:e.target.value}))} style={{width:"100%",background:C.dim,border:`1px solid ${C.linen}`,borderRadius:4,padding:"11px 14px",fontFamily:SS,fontSize:13,color:C.ink,outline:"none"}}>
                  <option value="">Non défini</option><option>{"<"} 50€/mois</option><option>50–100€/mois</option><option>100–200€/mois</option><option>{">"} 200€/mois</option>
                </select>
              </div>
              <button onClick={submit} disabled={!form.desc||loading} style={{width:"100%",background:C.gold,border:"none",borderRadius:4,padding:12,fontFamily:SS,fontSize:11,fontWeight:700,letterSpacing:"0.14em",textTransform:"uppercase",color:C.ink,cursor:"pointer",opacity:form.desc&&!loading?1:0.5}}>{loading?"Envoi…":"Envoyer ma demande"}</button>
            </div>
          )}
        </div>
        <div style={{background:C.ink,borderRadius:8,padding:26}}>
          <div style={{fontFamily:SF,fontSize:15,fontWeight:600,color:C.ivory,marginBottom:14}}>Comment ça marche ?</div>
          {[["1","Envoyez votre demande","Décrivez votre besoin précisément."],["2","Analyse sous 48h","Notre équipe prépare une proposition."],["3","Devis personnalisé","Si ok, on lance le développement."],["4","Livraison & support","Intégré à votre espace ONIQ."]].map(([n,t,d])=>(
            <div key={n} style={{display:"flex",gap:12,marginBottom:14}}>
              <div style={{width:24,height:24,borderRadius:"50%",background:C.gold,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:800,color:C.ink,flexShrink:0}}>{n}</div>
              <div><div style={{fontFamily:SS,fontSize:12,fontWeight:700,color:C.ivory,marginBottom:2}}>{t}</div><div style={{fontFamily:SS,fontSize:11,color:"rgba(255,255,255,0.38)",lineHeight:1.5}}>{d}</div></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ── BatiManager Hub ────────────────────────────────────────────────────────
const BatiManagerHub=({user,userSubs,onAuth,setView})=>{
  const [hasSub,setHasSub]=useState(false);
  const [checking,setChecking]=useState(true);
  const [fullscreen,setFullscreen]=useState(false);

  useEffect(()=>{
    if(!user?.id){setChecking(false);return;}
    supabase.from("subscriptions").select("id").eq("user_id",user.id).eq("status","active")
      .then(({data})=>{setHasSub(data&&data.length>0);setChecking(false);});
  },[user?.id]);

  if(checking) return <div style={{padding:"80px",textAlign:"center",fontFamily:SS,color:C.stone}}>Vérification…</div>;

  if(!user) return (
    <div style={{padding:"80px 36px",textAlign:"center"}}>
      <div style={{maxWidth:400,margin:"0 auto"}}>
        <div style={{fontSize:48,marginBottom:16}}>🏗️</div>
        <div style={{fontFamily:SF,fontSize:24,fontWeight:700,color:C.ink,marginBottom:8}}>BatiManager</div>
        <div style={{fontFamily:SS,fontSize:13,color:C.stone,marginBottom:24,lineHeight:1.7}}>Logiciel de gestion financière pour entreprises de construction. Connectez-vous pour y accéder.</div>
        <div style={{display:"flex",gap:10,justifyContent:"center"}}>
          <button onClick={()=>onAuth("login")} style={{background:"transparent",border:`1px solid ${C.linen}`,borderRadius:4,padding:"10px 20px",fontFamily:SS,fontSize:11,fontWeight:700,color:C.stone,cursor:"pointer",textTransform:"uppercase",letterSpacing:"0.1em"}}>Se connecter</button>
          <button onClick={()=>onAuth("register")} style={{background:C.gold,border:"none",borderRadius:4,padding:"10px 20px",fontFamily:SS,fontSize:11,fontWeight:800,color:C.ink,cursor:"pointer",textTransform:"uppercase",letterSpacing:"0.1em"}}>Essayer gratuitement</button>
        </div>
      </div>
    </div>
  );

  if(!hasSub) return (
    <div style={{padding:"60px 36px",textAlign:"center"}}>
      <div style={{maxWidth:480,margin:"0 auto"}}>
        <div style={{fontSize:48,marginBottom:16}}>🏗️</div>
        <div style={{fontFamily:SF,fontSize:24,fontWeight:700,color:C.ink,marginBottom:8}}>BatiManager</div>
        <div style={{background:C.goldDim,border:`1px solid ${C.gold}44`,borderRadius:10,padding:"24px 28px",marginBottom:24}}>
          <div style={{fontFamily:SF,fontSize:16,fontWeight:700,color:C.ink,marginBottom:6}}>Abonnement requis</div>
          <div style={{fontFamily:SS,fontSize:13,color:C.stone,lineHeight:1.7,marginBottom:16}}>Abonnez-vous à BatiManager pour accéder au logiciel directement depuis votre espace ONIQ.</div>
          <div style={{fontFamily:SF,fontSize:28,fontWeight:700,color:C.gold,marginBottom:16}}>169€<span style={{fontSize:13,fontWeight:400,color:C.stone}}>/mois</span></div>
          <button onClick={()=>setView("c-market")} style={{background:C.gold,border:"none",borderRadius:6,padding:"11px 28px",fontFamily:SS,fontSize:11,fontWeight:800,color:C.ink,cursor:"pointer",textTransform:"uppercase",letterSpacing:"0.12em"}}>S'abonner maintenant →</button>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,textAlign:"left"}}>
          {[["📊","Suivi des chantiers","Gérez tous vos projets en temps réel"],["📋","Grand Livre","Comptabilité complète et détaillée"],["💰","Trésorerie","Flux financiers et prévisions"],["📄","Factures","Suivi fournisseurs et clients"],["📈","Balance budgétaire","Écarts prévisionnels vs réalisés"],["🏢","Fournisseurs","Gestion complète des partenaires"]].map(([ic,t,d])=>(
            <div key={t} style={{background:C.paper,border:`1px solid ${C.linen}`,borderRadius:8,padding:"12px 14px",display:"flex",gap:8}}>
              <span style={{fontSize:18,flexShrink:0}}>{ic}</span>
              <div><div style={{fontFamily:SS,fontWeight:700,fontSize:11,color:C.ink,marginBottom:2}}>{t}</div><div style={{fontFamily:SS,fontSize:10,color:C.stone,lineHeight:1.4}}>{d}</div></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div style={{display:"flex",flexDirection:"column",position:"fixed",top:0,left:216,right:0,bottom:0,zIndex:5}}>
      <div style={{background:C.ink,padding:"10px 18px",display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0,borderBottom:`1px solid ${C.gold}33`}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <span style={{fontSize:18}}>🏗️</span>
          <div style={{fontFamily:SF,fontSize:14,fontWeight:700,color:C.ivory}}>BatiManager</div>
          <div style={{fontFamily:SS,fontSize:9,fontWeight:700,letterSpacing:"0.14em",textTransform:"uppercase",color:C.gold,background:C.goldDim,border:`1px solid ${C.gold}44`,borderRadius:3,padding:"2px 7px"}}>Accès actif</div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <div style={{fontFamily:SS,fontSize:11,color:"rgba(255,255,255,0.35)"}}>Connecté en tant que <strong style={{color:"rgba(255,255,255,0.6)"}}>{user.company||user.name}</strong></div>
          <button onClick={()=>setFullscreen(p=>!p)} style={{background:"rgba(255,255,255,0.08)",border:"1px solid rgba(255,255,255,0.12)",borderRadius:4,padding:"5px 10px",fontFamily:SS,fontSize:10,fontWeight:600,color:"rgba(255,255,255,0.5)",cursor:"pointer",letterSpacing:"0.08em"}}>{fullscreen?"⊡ Réduire":"⊞ Plein écran"}</button>
        </div>
      </div>
      <iframe
        src="/batimanager.html"
        style={{flex:1,border:"none",width:"100%",height:"100%"}}
        title="BatiManager"
      />
    </div>
  );
};

// ── Pages publiques ────────────────────────────────────────────────────────
const Secteurs=({onSector,onAuth})=>(
  <div style={{padding:"28px 36px"}}>
    <PH section="Référencement local" title="Solutions par secteur"/>
    <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:14,marginBottom:24}}>
      {[["Boulangerie","🥖","Caisse, stocks, commandes fournisseurs."],["Coiffure","✂️","Rendez-vous, fidélité et agenda en ligne."],["Garage","🔧","Suivi réparations, pièces et facturation."],["Restaurant","🍽️","Salle, commandes cuisine et réservations."],["Auto-école","🚗","Planning moniteurs, suivi élèves, examens."],["Pharmacie","💊","Stocks médicaments et alertes péremption."],["Commerce","🏪","Caisse, inventaire et gestion commerciale."],["Beauté","💅","Agenda, fidélité et vente de produits."],["Artisanat","🔨","Devis, facturation et suivi chantiers."]].map(([s,ic,txt])=>(
        <div key={s} onClick={()=>onSector(s)} style={{background:C.paper,border:`1px solid ${C.linen}`,borderRadius:8,padding:"18px 20px",cursor:"pointer",display:"flex",gap:12,alignItems:"flex-start",transition:"all 0.2s"}}
          onMouseEnter={e=>{e.currentTarget.style.borderColor=C.gold;e.currentTarget.style.transform="translateY(-2px)";}}
          onMouseLeave={e=>{e.currentTarget.style.borderColor=C.linen;e.currentTarget.style.transform="translateY(0)";}}
        >
          <span style={{fontSize:24,flexShrink:0}}>{ic}</span>
          <div><div style={{fontFamily:SF,fontSize:13,fontWeight:700,color:C.ink,marginBottom:3}}>Logiciel {s}</div><div style={{fontFamily:SS,fontSize:12,color:C.stone,lineHeight:1.5,marginBottom:7}}>{txt}</div><div style={{fontFamily:SS,fontSize:11,color:C.gold,fontWeight:700}}>Voir →</div></div>
        </div>
      ))}
    </div>
    <div style={{background:C.ink,borderRadius:8,padding:"22px 28px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
      <div><div style={{fontFamily:SF,fontSize:18,fontWeight:700,color:C.ivory,marginBottom:5}}>Votre secteur n'est pas listé ?</div><div style={{fontFamily:SS,fontSize:12,color:"rgba(255,255,255,0.4)"}}>Devis sur mesure, réponse sous 48h.</div></div>
      <button onClick={()=>onAuth("register")} style={{background:C.gold,border:"none",borderRadius:6,padding:"11px 24px",fontFamily:SS,fontSize:11,fontWeight:800,letterSpacing:"0.12em",textTransform:"uppercase",color:C.ink,cursor:"pointer",whiteSpace:"nowrap"}}>Demander un devis</button>
    </div>
  </div>
);

const Apropos=({onAuth})=>(
  <div style={{padding:"28px 36px"}}>
    <PH section="ONIQ" title="À propos"/>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:18,marginBottom:18}}>
      <div style={{background:C.ink,borderRadius:8,padding:26}}>
        <div style={{fontFamily:SF,fontSize:18,fontWeight:700,color:C.ivory,marginBottom:10}}>Notre mission</div>
        <div style={{fontFamily:SS,fontSize:13,color:"rgba(255,255,255,0.45)",lineHeight:1.8,marginBottom:20}}>ONIQ démocratise l'accès aux logiciels professionnels pour les TPE et indépendants. Abonnement mensuel sans engagement, essai gratuit sur chaque logiciel.</div>
        <div style={{display:"flex",gap:24}}>
          {[["500+","Professionnels"],["8+","Logiciels"],["4.8★","Note moy."]].map(([v,l])=>(
            <div key={l}><div style={{fontFamily:SF,fontSize:20,fontWeight:700,color:C.gold}}>{v}</div><div style={{fontFamily:SS,fontSize:10,color:"rgba(255,255,255,0.35)",marginTop:3}}>{l}</div></div>
          ))}
        </div>
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:10}}>
        {[["🆓","Essai 7 jours gratuit","Sans carte bancaire ni engagement."],["💳","Abonnement mensuel","Résiliable à tout moment."],["🛠️","Sur mesure possible","Votre besoin n'existe pas ? On le développe."],["💬","Support inclus","Email et téléphone dans chaque abonnement."]].map(([ic,t,d])=>(
          <div key={t} style={{background:C.paper,border:`1px solid ${C.linen}`,borderRadius:8,padding:"13px 16px",display:"flex",gap:10,alignItems:"flex-start"}}>
            <span style={{fontSize:18,flexShrink:0}}>{ic}</span>
            <div><div style={{fontFamily:SS,fontWeight:700,fontSize:12,color:C.ink,marginBottom:2}}>{t}</div><div style={{fontFamily:SS,fontSize:11,color:C.stone,lineHeight:1.5}}>{d}</div></div>
          </div>
        ))}
      </div>
    </div>
    <div style={{background:C.paper,border:`1px solid ${C.linen}`,borderRadius:8,padding:"20px 26px",display:"flex",alignItems:"center",justifyContent:"space-between",gap:20}}>
      <div><div style={{fontFamily:SF,fontSize:17,fontWeight:700,color:C.ink,marginBottom:3}}>Prêt à commencer ?</div><div style={{fontFamily:SS,fontSize:12,color:C.stone}}>7 jours gratuits sur tous les logiciels.</div></div>
      <div style={{display:"flex",gap:10}}>
        <button onClick={()=>onAuth("login")} style={{background:"transparent",border:`1px solid ${C.linen}`,borderRadius:4,padding:"9px 18px",fontFamily:SS,fontSize:11,fontWeight:700,color:C.stone,cursor:"pointer",textTransform:"uppercase",letterSpacing:"0.1em"}}>Se connecter</button>
        <button onClick={()=>onAuth("register")} style={{background:C.gold,border:"none",borderRadius:4,padding:"9px 18px",fontFamily:SS,fontSize:11,fontWeight:800,color:C.ink,cursor:"pointer",textTransform:"uppercase",letterSpacing:"0.1em"}}>Commencer gratuitement</button>
      </div>
    </div>
  </div>
);

// ── Admin Dashboard ────────────────────────────────────────────────────────
const AdminDash=({setView})=>{
  const [stats,setStats]=useState({clients:0,mrr:0,trials:0,pendingDevis:0});
  const [clients,setClients]=useState([]);

  useEffect(()=>{
    Promise.all([
      supabase.from("profiles").select("*").eq("role","client"),
      supabase.from("subscriptions").select("*,software(price)").eq("status","active"),
      supabase.from("subscriptions").select("*").eq("status","trial"),
      supabase.from("devis").select("*").eq("status","pending"),
    ]).then(([{data:p},{data:s},{data:t},{data:d}])=>{
      const mrr=(s||[]).reduce((sum,x)=>sum+(x.software?.price||0),0);
      setStats({clients:(p||[]).length,mrr,trials:(t||[]).length,pendingDevis:(d||[]).length});
      setClients((p||[]).slice(0,5));
    });
  },[]);

  return (
    <div>
      <PH section="Vue générale" title="Tableau de bord"/>
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:14,marginBottom:20}}>
        <KPI label="MRR" value={`${stats.mrr} €`} sub="revenus mensuels" accent trend/>
        <KPI label="Clients" value={stats.clients} sub="comptes actifs"/>
        <KPI label="Essais actifs" value={stats.trials} sub="en cours"/>
        <KPI label="Devis en attente" value={stats.pendingDevis} sub="à traiter"/>
      </div>
      <div style={{background:C.paper,border:`1px solid ${C.linen}`,borderRadius:6,padding:"18px 22px",marginBottom:16}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
          <div style={{fontFamily:SF,fontSize:14,fontWeight:600,color:C.ink}}>Évolution MRR (projection)</div>
          <div style={{fontFamily:SF,fontWeight:700,fontSize:16,color:C.gold}}>{stats.mrr} €/mois</div>
        </div>
        <Sparkline data={MRR_HIST}/>
      </div>
      <div style={{background:C.paper,border:`1px solid ${C.linen}`,borderRadius:6,overflow:"hidden"}}>
        <div style={{padding:"13px 18px",borderBottom:`1px solid ${C.linen}`,display:"flex",justifyContent:"space-between"}}>
          <span style={{fontFamily:SF,fontSize:13,fontWeight:600,color:C.ink}}>Derniers clients</span>
          <button onClick={()=>setView("a-clients")} style={{background:"none",border:"none",color:C.gold,cursor:"pointer",fontFamily:SS,fontSize:10,fontWeight:700,letterSpacing:"0.1em"}}>VOIR TOUT →</button>
        </div>
        {clients.length===0&&<div style={{padding:"20px",fontFamily:SS,fontSize:12,color:C.stone}}>Aucun client encore.</div>}
        {clients.map((c,i)=>(
          <div key={c.id}><div style={{display:"flex",alignItems:"center",gap:12,padding:"11px 18px"}}>
            <Mono i={(c.company||c.name||"?").slice(0,2).toUpperCase()} size={28}/>
            <div style={{flex:1}}><div style={{fontFamily:SS,fontWeight:600,fontSize:12,color:C.ink}}>{c.company||c.name}</div><div style={{fontFamily:SS,fontSize:11,color:C.stone}}>{c.email}</div></div>
            <Badge status={c.status}/>
          </div>{i<clients.length-1&&<HR s={{margin:"0 18px"}}/>}</div>
        ))}
      </div>
    </div>
  );
};

const AdminClients=({setView,setSelClient})=>{
  const [clients,setClients]=useState([]);
  const [search,setSearch]=useState("");
  const [loading,setLoading]=useState(true);

  useEffect(()=>{
    supabase.from("profiles").select("*").eq("role","client").then(({data})=>{setClients(data||[]);setLoading(false);});
  },[]);

  const filtered=clients.filter(c=>{const q=search.toLowerCase();return(c.company||"").toLowerCase().includes(q)||(c.email||"").toLowerCase().includes(q);});

  return (
    <div>
      <PH section="Gestion" title="Clients"/>
      <div style={{marginBottom:14}}>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Rechercher un client…" style={{width:"100%",background:C.paper,border:`1px solid ${C.linen}`,borderRadius:4,padding:"10px 14px",fontFamily:SS,fontSize:13,color:C.ink,outline:"none",boxSizing:"border-box"}}/>
      </div>
      {loading&&<div style={{padding:"40px",textAlign:"center",fontFamily:SS,color:C.stone}}>Chargement…</div>}
      <div style={{background:C.paper,border:`1px solid ${C.linen}`,borderRadius:6,overflow:"hidden"}}>
        {!loading&&filtered.length===0&&<div style={{padding:"30px",textAlign:"center",fontFamily:SS,color:C.stone}}>Aucun client trouvé.</div>}
        {filtered.map((c,i)=>(
          <div key={c.id}><div onClick={()=>{setSelClient(c);setView("a-client-detail");}} style={{display:"flex",alignItems:"center",gap:14,padding:"13px 18px",cursor:"pointer"}} onMouseEnter={e=>e.currentTarget.style.background=C.dim} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
            <Mono i={(c.company||c.name||"?").slice(0,2).toUpperCase()} size={32}/>
            <div style={{flex:1}}><div style={{fontFamily:SS,fontWeight:700,fontSize:13,color:C.ink}}>{c.company||c.name}</div><div style={{fontFamily:SS,fontSize:11,color:C.stone,marginTop:2}}>{c.email} · {c.sector||"Secteur non défini"}</div></div>
            <Badge status={c.status||"active"}/>
            <span style={{fontFamily:SS,fontSize:11,color:C.stone}}>→</span>
          </div>{i<filtered.length-1&&<HR s={{margin:"0 18px"}}/>}</div>
        ))}
      </div>
    </div>
  );
};

const AdminDevis=()=>{
  const [devis,setDevis]=useState([]);
  const [sel,setSel]=useState(null);
  const [amount,setAmount]=useState("");
  const [loading,setLoading]=useState(true);

  useEffect(()=>{
    supabase.from("devis").select("*").order("created_at",{ascending:false}).then(({data})=>{setDevis(data||[]);setLoading(false);});
  },[]);

  const send=async()=>{
    await supabase.from("devis").update({status:"quoted",amount:parseFloat(amount)}).eq("id",sel.id);
    setDevis(p=>p.map(d=>d.id===sel.id?{...d,status:"quoted",amount:parseFloat(amount)}:d));
    setSel(null);
  };

  return (
    <div>
      <PH section="Commercial" title="Demandes de devis"/>
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12,marginBottom:20}}>
        <KPI label="En attente" value={devis.filter(d=>d.status==="pending").length} accent/>
        <KPI label="Envoyés" value={devis.filter(d=>d.status==="quoted").length}/>
        <KPI label="Convertis" value={devis.filter(d=>d.status==="done").length}/>
      </div>
      {loading&&<div style={{padding:"40px",textAlign:"center",fontFamily:SS,color:C.stone}}>Chargement…</div>}
      <div style={{background:C.paper,border:`1px solid ${C.linen}`,borderRadius:6,overflow:"hidden"}}>
        {!loading&&devis.length===0&&<div style={{padding:"30px",textAlign:"center",fontFamily:SS,color:C.stone}}>Aucune demande de devis.</div>}
        {devis.map((d,i)=>(
          <div key={d.id}><div onClick={()=>{setSel(d);setAmount(d.amount||"");}} style={{display:"flex",alignItems:"center",gap:14,padding:"13px 18px",cursor:"pointer"}} onMouseEnter={e=>e.currentTarget.style.background=C.dim} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
            <div style={{flex:1}}><div style={{fontFamily:SS,fontWeight:700,fontSize:13,color:C.ink}}>{d.client_name}</div><div style={{fontFamily:SS,fontSize:11,color:C.stone,marginTop:2}}>{d.description?.slice(0,60)}…</div></div>
            <div style={{textAlign:"right"}}><Badge status={d.status}/><div style={{fontFamily:SS,fontSize:10,color:C.stone,marginTop:4}}>{new Date(d.created_at).toLocaleDateString("fr-FR")}</div></div>
          </div>{i<devis.length-1&&<HR s={{margin:"0 18px"}}/>}</div>
        ))}
      </div>
      {sel&&(
        <Overlay title="Demande de devis" onClose={()=>setSel(null)} wide>
          <div style={{background:C.dim,border:`1px solid ${C.linen}`,borderRadius:6,padding:14,marginBottom:16}}>
            <div style={{fontFamily:SS,fontWeight:700,fontSize:13,color:C.ink}}>{sel.client_name} — {sel.client_email}</div>
            <div style={{fontFamily:SS,fontSize:13,color:C.ink,lineHeight:1.6,marginTop:8}}>{sel.description}</div>
            {sel.budget&&<div style={{fontFamily:SS,fontSize:11,color:C.stone,marginTop:6}}>Budget : {sel.budget}</div>}
          </div>
          <TI label="Tarif mensuel proposé (€)" value={amount} onChange={e=>setAmount(e.target.value)} type="number" placeholder="ex: 49"/>
          <div style={{display:"flex",gap:10}}>
            <button onClick={()=>setSel(null)} style={{flex:1,background:"transparent",border:`1px solid ${C.linen}`,borderRadius:4,padding:"9px",fontFamily:SS,fontSize:11,fontWeight:700,color:C.stone,cursor:"pointer",textTransform:"uppercase",letterSpacing:"0.1em"}}>Fermer</button>
            <button onClick={send} style={{flex:2,background:C.gold,border:"none",borderRadius:4,padding:"9px",fontFamily:SS,fontSize:11,fontWeight:700,color:C.ink,cursor:"pointer",textTransform:"uppercase",letterSpacing:"0.1em"}}>Envoyer le devis</button>
          </div>
        </Overlay>
      )}
    </div>
  );
};

// ── Nav ────────────────────────────────────────────────────────────────────
const PUBLIC_NAV=[{id:"c-market",label:"Marketplace",g:"◈"},{id:"pub-secteurs",label:"Par secteur",g:"◉"},{id:"pub-apropos",label:"À propos",g:"◎"}];
const CLIENT_EXTRA=[{id:"c-espace",label:"Mon espace",g:"◧"},{id:"c-batimanager",label:"BatiManager",g:"🏗️",pro:true},{id:"c-parrainage",label:"Parrainage",g:"◆"},{id:"c-devis",label:"Devis sur mesure",g:"◫"}];
const ADMIN_NAV=[{id:"a-dashboard",label:"Dashboard",g:"◈"},{id:"a-clients",label:"Clients",g:"◉"},{id:"a-devis",label:"Devis",g:"◎"},{id:"a-software",label:"Logiciels",g:"◧"}];
const LOCKED=[{id:"c-espace",label:"Mon espace",g:"◧"},{id:"c-batimanager",label:"BatiManager",g:"🏗️"},{id:"c-parrainage",label:"Parrainage",g:"◆"},{id:"c-devis",label:"Devis sur mesure",g:"◫"}];

// ── App ────────────────────────────────────────────────────────────────────
export default function App() {
  const [view,setView]=useState("c-market");
  const [user,setUser]=useState(null);
  const [software,setSoftware]=useState([]);
  const [selClient,setSelClient]=useState(null);
  const [showAuth,setShowAuth]=useState(false);
  const [authMode,setAuthMode]=useState("login");
  const [selSector,setSelSector]=useState("");
  const [loading,setLoading]=useState(true);
  const [globalSubs,setGlobalSubs]=useState([]);

  // Check session on load
  useEffect(()=>{
    supabase.auth.getSession().then(async({data:{session}})=>{
      if(session?.user){
        const {data:profile}=await supabase.from("profiles").select("*").eq("id",session.user.id).single();
        if(profile)setUser({...session.user,...profile});
        // Load global subs
        const {data:subs}=await supabase.from("subscriptions").select("software_id").eq("user_id",session.user.id).eq("status","active");
        if(subs)setGlobalSubs(subs.map(s=>s.software_id));
      }
      setLoading(false);
    });
    supabase.auth.onAuthStateChange(async(event,session)=>{
      if(session?.user){
        const {data:profile}=await supabase.from("profiles").select("*").eq("id",session.user.id).single();
        if(profile)setUser({...session.user,...profile});
        const {data:subs}=await supabase.from("subscriptions").select("software_id").eq("user_id",session.user.id).eq("status","active");
        if(subs)setGlobalSubs(subs.map(s=>s.software_id));
      } else {setUser(null);setGlobalSubs([]);}
    });
    // Load software
    supabase.from("software").select("*").then(({data})=>{
      if(data&&data.length>0){setSoftware(data);}
      else{
        // BatiManager — logiciel de gestion financière pour entreprises de construction
        setSoftware([{
          id:1,name:"BatiManager",cat:"Construction & BTP",icon:"🏗️",
          price:169,rating:4.9,reviews:47,popular:true,
          description:"Logiciel de gestion financière complet pour entreprises de construction. Suivez vos chantiers, budgets, factures et trésorerie en temps réel.",
          features:["Suivi des chantiers et avancement","Grand Livre comptable","Balance budgétaire prévisionnelle","Gestion des factures fournisseurs","Tableau de bord trésorerie","Récapitulatif financier annuel","Gestion des fournisseurs","Prévisionnel multi-chantiers"],
          sector:["Construction","Artisanat","BTP"]
        }]);
      }
    });
  },[]);

  const openAuth=(mode)=>{setAuthMode(mode);setShowAuth(true);};
  const login=(u)=>{setUser(u);setView(u.role==="admin"?"a-dashboard":"c-market");setShowAuth(false);};
  const logout=async()=>{await supabase.auth.signOut();setUser(null);setView("c-market");};

  const isAdmin=user?.role==="admin";
  const activeNav=view==="a-client-detail"?"a-clients":view;
  const NAV=isAdmin?ADMIN_NAV:[...PUBLIC_NAV,...(user?CLIENT_EXTRA:[])];

  if(loading)return(
    <div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"100vh",background:C.deep,flexDirection:"column",gap:16}}>
      <div style={{fontFamily:SF,fontSize:28,fontWeight:700,color:C.ivory,letterSpacing:6}}>ONIQ</div>
      <div style={{height:2,width:60,background:`linear-gradient(90deg,transparent,${C.gold},transparent)`,animation:"pulse 1.5s infinite"}}/>
    </div>
  );

  return (
    <div style={{fontFamily:SS,background:C.dim,minHeight:"100vh",display:"flex"}}>
      {showAuth&&<AuthModal onLogin={login} initMode={authMode} onClose={()=>setShowAuth(false)}/>}

      {/* Sidebar */}
      <div style={{width:216,background:C.deep,display:"flex",flexDirection:"column",position:"fixed",top:0,left:0,bottom:0,zIndex:10}}>
        <div style={{padding:"22px 18px 14px",borderBottom:"1px solid rgba(255,255,255,0.05)"}}>
          <div style={{fontFamily:SF,fontSize:20,fontWeight:700,color:C.ivory,letterSpacing:5,marginBottom:4}}>ONIQ</div>
          <div style={{height:1,background:`linear-gradient(90deg,${C.gold}88,transparent)`,marginBottom:5}}/>
          <div style={{fontFamily:SS,fontSize:8,letterSpacing:"0.22em",textTransform:"uppercase",color:"rgba(255,255,255,0.18)"}}>{isAdmin?"Admin":user?"Espace Client":"Marketplace"}</div>
        </div>
        <nav style={{flex:1,padding:"10px 8px",display:"flex",flexDirection:"column",gap:2,overflowY:"auto"}}>
          {NAV.map(item=>(
            <button key={item.id} onClick={()=>setView(item.id)} style={{display:"flex",alignItems:"center",gap:10,padding:"9px 13px",borderRadius:4,background:activeNav===item.id?`${C.gold}1A`:"transparent",border:`1px solid ${activeNav===item.id?C.gold+"44":"transparent"}`,color:activeNav===item.id?C.gold:"rgba(255,255,255,0.33)",cursor:"pointer",fontFamily:SS,fontSize:12,fontWeight:activeNav===item.id?600:400,textAlign:"left",transition:"all 0.15s",width:"100%"}}
              onMouseEnter={e=>{if(activeNav!==item.id){e.currentTarget.style.color="rgba(255,255,255,0.6)";e.currentTarget.style.background="rgba(255,255,255,0.04)";}}}
              onMouseLeave={e=>{if(activeNav!==item.id){e.currentTarget.style.color="rgba(255,255,255,0.33)";e.currentTarget.style.background="transparent";}}}
            ><span style={{fontSize:11,opacity:item.g==="🏗️"?1:0.5}}>{item.g}</span>{item.label}{item.id==="c-batimanager"&&globalSubs.length>0&&<span style={{fontSize:8,background:C.green,color:"#fff",borderRadius:3,padding:"1px 5px",marginLeft:4,fontWeight:800}}>ACTIF</span>}</button>
          ))}
          {!user&&(
            <>
              <div style={{height:1,background:"rgba(255,255,255,0.05)",margin:"8px 6px"}}/>
              <div style={{padding:"5px 13px 3px",fontFamily:SS,fontSize:8,fontWeight:700,letterSpacing:"0.18em",textTransform:"uppercase",color:"rgba(255,255,255,0.18)"}}>Espace pro</div>
              {LOCKED.map(item=>(
                <button key={item.id} onClick={()=>openAuth("register")} style={{display:"flex",alignItems:"center",gap:10,padding:"9px 13px",borderRadius:4,background:"transparent",border:"1px solid transparent",color:"rgba(255,255,255,0.18)",cursor:"pointer",fontFamily:SS,fontSize:12,textAlign:"left",width:"100%",transition:"all 0.15s"}}
                  onMouseEnter={e=>{e.currentTarget.style.color="rgba(255,255,255,0.42)";e.currentTarget.style.background="rgba(255,255,255,0.03)";}}
                  onMouseLeave={e=>{e.currentTarget.style.color="rgba(255,255,255,0.18)";e.currentTarget.style.background="transparent";}}
                ><span style={{fontSize:11,opacity:0.35}}>{item.g}</span><span style={{flex:1}}>{item.label}</span><span style={{fontSize:9,opacity:0.4}}>🔒</span></button>
              ))}
            </>
          )}
        </nav>
        <div style={{padding:"11px 14px",borderTop:"1px solid rgba(255,255,255,0.05)"}}>
          {user?(
            <>
              <div style={{display:"flex",alignItems:"center",gap:9,marginBottom:9}}>
                <div style={{width:26,height:26,borderRadius:4,background:C.gold,display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,fontWeight:800,color:C.ink,fontFamily:SF,flexShrink:0}}>{(user.company||user.name||"?").slice(0,2).toUpperCase()}</div>
                <div style={{overflow:"hidden"}}><div style={{fontFamily:SS,fontSize:11,fontWeight:600,color:C.ivory,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{user.company||user.name}</div><div style={{fontFamily:SS,fontSize:8,letterSpacing:"0.1em",color:"rgba(255,255,255,0.22)",textTransform:"uppercase"}}>{isAdmin?"Admin":"Client"}</div></div>
              </div>
              <button onClick={logout} style={{width:"100%",background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:4,padding:"7px",fontFamily:SS,fontSize:10,fontWeight:600,color:"rgba(255,255,255,0.28)",cursor:"pointer",letterSpacing:"0.08em",textTransform:"uppercase"}}>Déconnexion</button>
            </>
          ):(
            <div style={{display:"flex",flexDirection:"column",gap:7}}>
              <button onClick={()=>openAuth("register")} style={{width:"100%",background:C.gold,border:"none",borderRadius:4,padding:"9px",fontFamily:SS,fontSize:10,fontWeight:800,color:C.ink,cursor:"pointer",letterSpacing:"0.1em",textTransform:"uppercase"}}>Créer un compte</button>
              <button onClick={()=>openAuth("login")} style={{width:"100%",background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:4,padding:"7px",fontFamily:SS,fontSize:10,fontWeight:600,color:"rgba(255,255,255,0.4)",cursor:"pointer",letterSpacing:"0.08em",textTransform:"uppercase"}}>Se connecter</button>
            </div>
          )}
        </div>
      </div>

      {/* Main */}
      <div style={{marginLeft:216,flex:1,overflowY:"auto",minHeight:"100vh"}}>
        {isAdmin&&(
          <div style={{padding:"32px 36px",maxWidth:1040,margin:"0 auto"}}>
            {view==="a-dashboard"&&<AdminDash setView={setView}/>}
            {view==="a-clients"&&<AdminClients setView={setView} setSelClient={setSelClient}/>}
            {view==="a-client-detail"&&selClient&&(
              <div>
                <button onClick={()=>setView("a-clients")} style={{background:"none",border:"none",color:C.stone,cursor:"pointer",fontFamily:SS,fontSize:10,letterSpacing:"0.14em",textTransform:"uppercase",marginBottom:14,padding:0}}>← Retour</button>
                <div style={{display:"flex",alignItems:"center",gap:14,marginBottom:24,paddingBottom:18,borderBottom:`1px solid ${C.linen}`}}>
                  <Mono i={(selClient.company||selClient.name||"?").slice(0,2).toUpperCase()} size={44}/>
                  <div><h1 style={{margin:0,fontFamily:SF,fontSize:22,fontWeight:700,color:C.ink}}>{selClient.company||selClient.name}</h1><div style={{fontFamily:SS,fontSize:11,color:C.stone,marginTop:3}}>{selClient.email} · {selClient.sector||"–"}</div></div>
                  <div style={{marginLeft:"auto"}}><Badge status={selClient.status||"active"}/></div>
                </div>
                <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12}}>
                  <KPI label="Secteur" value={selClient.sector||"–"}/>
                  <KPI label="Parrainages" value={selClient.referrals||0}/>
                  <KPI label="Code parrainage" value={selClient.referral_code||"–"}/>
                </div>
              </div>
            )}
            {view==="a-devis"&&<AdminDevis/>}
            {view==="a-software"&&(
              <div>
                <PH section="Catalogue" title="Logiciels"/>
                <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:14}}>
                  {software.map(s=>(
                    <div key={s.id} style={{background:C.paper,border:`1px solid ${C.linen}`,borderRadius:6,padding:20}}>
                      <div style={{fontSize:24,marginBottom:8}}>{s.icon}</div>
                      <div style={{fontFamily:SF,fontSize:13,fontWeight:700,color:C.ink,marginBottom:2}}>{s.name}</div>
                      <Stars r={s.rating||0} sm/><div style={{fontFamily:SS,fontSize:11,color:C.stone,marginTop:2,marginBottom:8}}>{s.reviews} avis</div>
                      <div style={{fontFamily:SF,fontWeight:700,fontSize:16,color:C.gold}}>{s.price}€<span style={{fontSize:11,fontWeight:400,color:C.stone}}>/mois</span></div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
        {!isAdmin&&(
          <>
            {view==="c-market"&&<Marketplace user={user} setUser={setUser} software={software} setView={setView} onAuth={openAuth}/>}
            {view==="pub-secteurs"&&<Secteurs onSector={s=>{setSelSector(s);setView("pub-sector-detail");}} onAuth={openAuth}/>}
            {view==="pub-sector-detail"&&(
              <div style={{padding:"28px 36px"}}>
                <button onClick={()=>setView("pub-secteurs")} style={{background:"none",border:"none",color:C.stone,cursor:"pointer",fontFamily:SS,fontSize:10,letterSpacing:"0.14em",textTransform:"uppercase",marginBottom:18,padding:0}}>← Retour</button>
                <div style={{background:`linear-gradient(135deg,${C.ink},#1c1409)`,borderRadius:10,padding:"32px 36px",marginBottom:22,textAlign:"center"}}>
                  <div style={{fontFamily:SF,fontSize:26,fontWeight:700,color:C.ivory,marginBottom:8}}>Logiciel {selSector}</div>
                  <div style={{fontFamily:SS,fontSize:12,color:"rgba(255,255,255,0.4)",marginBottom:20}}>Essai 7 jours gratuit · Sans carte bancaire</div>
                  <button onClick={()=>openAuth("register")} style={{background:C.gold,border:"none",borderRadius:6,padding:"11px 26px",fontFamily:SS,fontSize:11,fontWeight:800,letterSpacing:"0.12em",textTransform:"uppercase",color:C.ink,cursor:"pointer"}}>Commencer gratuitement</button>
                </div>
                <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:16}}>
                  {software.filter(sw=>sw.sector?.includes(selSector)).map(sw=>(
                    <div key={sw.id} style={{background:C.paper,border:`1px solid ${C.linen}`,borderRadius:8,padding:20}}>
                      <div style={{fontSize:24,marginBottom:8}}>{sw.icon}</div>
                      <div style={{fontFamily:SF,fontSize:14,fontWeight:700,color:C.ink,marginBottom:3}}>{sw.name}</div>
                      <Stars r={sw.rating} sm/>
                      <div style={{fontFamily:SF,fontWeight:700,fontSize:17,color:C.gold,marginTop:8}}>{sw.price}€<span style={{fontSize:11,fontWeight:400,color:C.stone}}>/mois</span></div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {view==="pub-apropos"&&<Apropos onAuth={openAuth}/>}
            {view==="c-espace"&&user&&<MonEspace user={user} software={software}/>}
            {view==="c-batimanager"&&<BatiManagerHub user={user} userSubs={globalSubs} onAuth={openAuth} setView={setView}/>}
            {view==="c-parrainage"&&user&&<Parrainage user={user}/>}
            {view==="c-devis"&&user&&<DevisClient user={user}/>}
            {(view==="c-espace"||view==="c-parrainage"||view==="c-devis")&&!user&&(
              <div style={{padding:"80px 36px",textAlign:"center"}}>
                <div style={{maxWidth:380,margin:"0 auto"}}>
                  <div style={{fontSize:38,marginBottom:14}}>🔒</div>
                  <div style={{fontFamily:SF,fontSize:22,fontWeight:700,color:C.ink,marginBottom:7}}>Fonctionnalité pro</div>
                  <div style={{fontFamily:SS,fontSize:13,color:C.stone,marginBottom:26,lineHeight:1.7}}>Connectez-vous pour accéder à cette section.</div>
                  <div style={{display:"flex",gap:10,justifyContent:"center"}}>
                    <button onClick={()=>openAuth("login")} style={{background:"transparent",border:`1px solid ${C.linen}`,borderRadius:4,padding:"9px 18px",fontFamily:SS,fontSize:11,fontWeight:700,color:C.stone,cursor:"pointer",textTransform:"uppercase",letterSpacing:"0.1em"}}>Se connecter</button>
                    <button onClick={()=>openAuth("register")} style={{background:C.gold,border:"none",borderRadius:4,padding:"9px 18px",fontFamily:SS,fontSize:11,fontWeight:800,color:C.ink,cursor:"pointer",textTransform:"uppercase",letterSpacing:"0.1em"}}>Créer un compte gratuit</button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

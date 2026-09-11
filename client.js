const role=document.body.dataset.role,other=role==="levi"?"ikaleth":"levi";
let conn=null,last=null,peerReady=false,connectTimer=null;
const $=s=>document.querySelector(s);
const params=new URLSearchParams(location.search);
const autoHost=(params.get("host")||"").trim();
const peer=new Peer();

const diag=document.createElement("div");
diag.id="diag";
diag.className="muted";
diag.style.cssText="font-size:.78rem;margin-top:8px;white-space:pre-wrap";
$("#status").after(diag);

function setStatus(t,c){$("#status").textContent=t;$("#status").className="status "+c}
function setDiag(t){diag.textContent=t}
function setJoinVisible(show){const el=$("#joinRow");if(el)el.hidden=!show}
function errText(e){return [e?.type,e?.message].filter(Boolean).join(" · ")||"desconocido"}

peer.on("open",id=>{
  peerReady=true;
  setDiag("Señalización OK · cliente "+id.slice(0,8)+"…");
  if(autoHost){
    $("#hostid").value=autoHost;
    setJoinVisible(false);
    connect(autoHost);
  }else{
    setJoinVisible(true);
    setStatus("Introduce el código del host.","wait");
  }
});
peer.on("disconnected",()=>setDiag("Señalización desconectada. Intentando recuperar…"));
peer.on("error",e=>{
  setStatus("Error de red: "+errText(e),"bad");
  setDiag("PeerJS: "+errText(e));
});

function watchConnection(c){
  const pc=c.peerConnection;
  if(!pc){
    setDiag("Señalización OK · esperando canal P2P…");
    return;
  }
  const refresh=()=>{
    setDiag("P2P · ICE: "+(pc.iceConnectionState||"?")+" · conexión: "+(pc.connectionState||"?")+" · señal: "+(pc.signalingState||"?"));
  };
  ["iceconnectionstatechange","connectionstatechange","signalingstatechange"].forEach(ev=>pc.addEventListener(ev,refresh));
  refresh();
}

function connect(forcedId){
  const id=(forcedId||$("#hostid").value||"").trim();
  if(!id||!peerReady)return;
  if(connectTimer)clearTimeout(connectTimer);
  setStatus("Conectando con el artefacto…","wait");
  setDiag("Señalización OK · solicitando conexión al host…");
  conn=peer.connect(id,{metadata:{role},serialization:"json",reliable:true});
  watchConnection(conn);
  connectTimer=setTimeout(()=>{
    if(!conn?.open){
      setStatus("No se completó la conexión P2P.","bad");
      const pc=conn?.peerConnection;
      const ice=pc?.iceConnectionState||"sin dato";
      setDiag("Diagnóstico: ICE "+ice+". Pulsa Enlazar para reintentar.");
      setJoinVisible(true);
    }
  },12000);
  conn.on("open",()=>{
    clearTimeout(connectTimer);
    setStatus("Artefacto enlazado.","ok");
    setJoinVisible(false);
    watchConnection(conn);
  });
  conn.on("data",m=>{if(m?.type==="state"){last=m;draw(m.map,m.otherPos,m.solved)}});
  conn.on("close",()=>{
    clearTimeout(connectTimer);
    setStatus("Conexión cerrada.","bad");
    setJoinVisible(true);
  });
  conn.on("error",e=>{
    clearTimeout(connectTimer);
    setStatus("No se pudo enlazar.","bad");
    setDiag("DataConnection: "+errText(e));
    setJoinVisible(true);
  });
}

function draw(map,pos,solved){
  const el=$("#maze");el.innerHTML="";
  map.forEach((row,y)=>[...row].forEach((ch,x)=>{
    const c=document.createElement("div");c.className="cell";
    if(ch==="#")c.classList.add("wall");
    const open=(ch==="a"&&solved.A)||(ch==="b"&&solved.B);
    if((ch==="a"||ch==="b")&&!open)c.classList.add("barrier");
    if(pos[0]===x&&pos[1]===y)c.classList.add("marker");
    el.appendChild(c);
  }));
}
function move(dir){if(conn?.open)conn.send({type:"move",role,dir})}
$("#join").onclick=()=>connect();
document.querySelectorAll("[data-dir]").forEach(b=>b.onclick=()=>move(b.dataset.dir));
const role=document.body.dataset.role,other=role==="levi"?"ikaleth":"levi";
let conn=null,last=null,peerReady=false;
const $=s=>document.querySelector(s);
const params=new URLSearchParams(location.search);
const autoHost=(params.get("host")||"").trim();
const peer=new Peer();
function setStatus(t,c){$("#status").textContent=t;$("#status").className="status "+c}
function setJoinVisible(show){const el=$("#joinRow");if(el)el.hidden=!show}
peer.on("open",()=>{peerReady=true;if(autoHost){$("#hostid").value=autoHost;setJoinVisible(false);connect(autoHost)}else{setJoinVisible(true);setStatus("Introduce el código del host.","wait")}});
peer.on("error",e=>setStatus("Error de red: "+e.type,"bad"));
function connect(forcedId){const id=(forcedId||$("#hostid").value||"").trim();if(!id||!peerReady)return;setStatus("Conectando con el artefacto…","wait");conn=peer.connect(id,{metadata:{role},serialization:"json"});conn.on("open",()=>setStatus("Artefacto enlazado.","ok"));conn.on("data",m=>{if(m?.type==="state"){last=m;draw(m.map,m.otherPos,m.solved)}});conn.on("close",()=>setStatus("Conexión cerrada.","bad"));conn.on("error",()=>setStatus("No se pudo enlazar.","bad"))}
function draw(map,pos,solved){const el=$("#maze");el.innerHTML="";map.forEach((row,y)=>[...row].forEach((ch,x)=>{const c=document.createElement("div");c.className="cell";if(ch==="#")c.classList.add("wall");const open=(ch==="a"&&solved.A)||(ch==="b"&&solved.B);if((ch==="a"||ch==="b")&&!open)c.classList.add("barrier");if(pos[0]===x&&pos[1]===y)c.classList.add("marker");el.appendChild(c)}))}
function move(dir){if(conn?.open)conn.send({type:"move",role,dir})}
$("#join").onclick=()=>connect();document.querySelectorAll("[data-dir]").forEach(b=>b.onclick=()=>move(b.dataset.dir));
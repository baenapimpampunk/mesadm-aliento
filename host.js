const initial={positions:{levi:[1,1],ikaleth:[11,1]},solved:{A:false,B:false,C:false},phase:"maze"};
let state=structuredClone(initial),conns={levi:null,ikaleth:null},events=[];
const peer=new Peer(),$=s=>document.querySelector(s);
function log(t){events.push(new Date().toLocaleTimeString()+" · "+t);$("#log").innerHTML=events.slice(-12).reverse().join("<br>")}
function tile(role,x,y){return CANON_MAPS[role][y][x]}
function openBarrier(ch){return(ch==="a"&&state.solved.A)||(ch==="b"&&state.solved.B)}
function passable(ch){return ch!=="# "&&ch!=="#"&&!((ch==="a"||ch==="b")&&!openBarrier(ch))}
function move(role,dir){const[x,y]=state.positions[role],d={N:[0,-1],S:[0,1],W:[-1,0],E:[1,0]}[dir],nx=x+d[0],ny=y+d[1],ch=tile(role,nx,ny);if(passable(ch)){state.positions[role]=[nx,ny];log(`${role}: ${dir} válido`)}else log(`${role}: ${dir} BLOQUEADO por corriente`);broadcast();render()}
function snapshotFor(role){const other=role==="levi"?"ikaleth":"levi";return{type:"state",role,other,map:CANON_MAPS[other],otherPos:state.positions[other],solved:state.solved}}
function send(role){const c=conns[role];if(c&&c.open)c.send(snapshotFor(role))}
function broadcast(){send("levi");send("ikaleth")}
function attach(conn){const role=conn.metadata?.role;if(!["levi","ikaleth"].includes(role)){conn.on("open",()=>conn.close());return}conns[role]=conn;render();conn.on("open",()=>{log(role+" conectado");send(role);render()});conn.on("data",m=>{if(m?.type==="move"&&m.role===role&&["N","S","E","W"].includes(m.dir))move(role,m.dir)});conn.on("close",()=>{if(conns[role]===conn)conns[role]=null;log(role+" desconectado");render()})}
function makeClientUrl(filename,id){const u=new URL(filename,location.href);u.searchParams.set("host",id);return u.href}
function renderQR(target,url){const el=$(target);el.innerHTML="";new QRCode(el,{text:url,width:190,height:190,colorDark:"#071014",colorLight:"#ffffff",correctLevel:QRCode.CorrectLevel.M})}
function showLinks(id){const levi=makeClientUrl("LEVI_MOVIL.html",id),ika=makeClientUrl("IKALETH_MOVIL.html",id);$("#leviLink").href=levi;$("#ikaLink").href=ika;renderQR("#qrLevi",levi);renderQR("#qrIka",ika);$("#qrArea").hidden=false}
peer.on("open",id=>{$("#room").textContent=id;$("#peerStatus").textContent="Host listo";$("#peerStatus").className="status ok";showLinks(id);log("Host listo")});
peer.on("connection",attach);
peer.on("error",e=>{$("#peerStatus").textContent="Error de red: "+e.type;$("#peerStatus").className="status bad";log("PeerJS "+e.type)});
function draw(el,mapName,pos){el.innerHTML="";CANON_MAPS[mapName].forEach((row,y)=>[...row].forEach((ch,x)=>{const c=document.createElement("div");c.className="cell";if(ch==="#")c.classList.add("wall");if((ch==="a"||ch==="b")&&!openBarrier(ch))c.classList.add("barrier");if("ABFEC?".includes(ch))c.classList.add("node");if(pos[0]===x&&pos[1]===y)c.classList.add("marker");el.appendChild(c)}))}
function render(){draw($("#dmLevi"),"levi",state.positions.levi);draw($("#dmIka"),"ikaleth",state.positions.ikaleth);$("#leviState").textContent=conns.levi?.open?"Levi conectado":"Levi esperando";$("#ikaState").textContent=conns.ikaleth?.open?"Ikaleth conectada":"Ikaleth esperando"}
$("#reset").onclick=()=>{state=structuredClone(initial);log("Prueba reiniciada");broadcast();render()};render();
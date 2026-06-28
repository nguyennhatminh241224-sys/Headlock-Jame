const API_BASE = location.origin;
const ADMIN_TOKEN_KEY = "headlock_admin_password";

const $ = (id) => document.getElementById(id);
let currentKey = "";

function token(){ return localStorage.getItem(ADMIN_TOKEN_KEY) || ""; }
function authHeaders(){ return { "Content-Type":"application/json", "x-admin-password": token() }; }
function msg(id, text, ok=true){ const el=$(id); if(!el)return; el.textContent=text; el.className="msg "+(ok?"good":"bad"); }
function fmt(value){ if(!value) return "vĩnh viễn"; const d=new Date(value); return isNaN(d.getTime())?value:d.toLocaleString("vi-VN"); }
function toDatetimeLocal(value){ if(!value) return ""; const d=new Date(value); if(isNaN(d.getTime())) return ""; d.setMinutes(d.getMinutes()-d.getTimezoneOffset()); return d.toISOString().slice(0,16); }
function fromDatetimeLocal(value){ return value ? new Date(value).toISOString() : null; }

async function api(path, options={}){
  const res = await fetch(API_BASE + path, { ...options, headers:{...authHeaders(), ...(options.headers||{})} });
  const data = await res.json().catch(()=>({success:false,message:"API lỗi"}));
  if(!res.ok || data.success === false) throw new Error(data.message || "Yêu cầu thất bại");
  return data;
}

function showAdmin(){ $("loginBox").classList.add("hidden"); $("adminPanel").classList.remove("hidden"); loadAll(); }
function showLogin(){ $("loginBox").classList.remove("hidden"); $("adminPanel").classList.add("hidden"); }

async function login(){
  const password = $("adminPassword").value.trim();
  if(!password) return msg("loginMsg","Nhập mật khẩu admin",false);
  try{
    const res = await fetch(API_BASE+"/admin/login",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({password})});
    const data = await res.json();
    if(!data.success) throw new Error(data.message||"Sai mật khẩu");
    localStorage.setItem(ADMIN_TOKEN_KEY,password);
    showAdmin();
  }catch(e){ msg("loginMsg",e.message,false); }
}

async function loadStats(){
  try{
    const d = await fetch(API_BASE+"/stats").then(r=>r.json());
    $("statOnline").textContent = d.online ?? 0;
    $("statActiveKeys").textContent = d.activeKeys ?? 0;
    $("statToday").textContent = d.today ?? 0;
    $("statTotalDevices").textContent = d.totalDevices ?? 0;
  }catch{}
}

async function loadKeys(){
  const tbody = $("keysBody"); tbody.innerHTML = "<tr><td colspan='6'>Đang tải...</td></tr>";
  try{
    const data = await api("/admin/keys");
    tbody.innerHTML = "";
    data.keys.forEach(k=>{
      const tr=document.createElement("tr");
      tr.innerHTML=`
        <td><b>${k.key}</b></td>
        <td>${k.type||"custom"}</td>
        <td>${fmt(k.expiresAt)}</td>
        <td>${k.slotUsed||0}/${k.maxDevices||1}</td>
        <td>${k.revoked?"Đã khóa":"Hoạt động"}</td>
        <td class="actions">
          <button class="ghost" data-edit="${k.key}">Sửa</button>
          <button class="ghost" data-devices="${k.key}">Thiết bị</button>
          <button class="warn" data-reset="${k.key}">Reset máy</button>
          <button class="danger" data-delete="${k.key}">Xóa</button>
        </td>`;
      tbody.appendChild(tr);
    });
    tbody.querySelectorAll("[data-edit]").forEach(b=>b.onclick=()=>fillKey(data.keys.find(k=>k.key===b.dataset.edit)));
    tbody.querySelectorAll("[data-devices]").forEach(b=>b.onclick=()=>loadDevices(b.dataset.devices));
    tbody.querySelectorAll("[data-reset]").forEach(b=>b.onclick=()=>resetDevices(b.dataset.reset));
    tbody.querySelectorAll("[data-delete]").forEach(b=>b.onclick=()=>deleteKey(b.dataset.delete));
  }catch(e){ tbody.innerHTML=`<tr><td colspan='6'>${e.message}</td></tr>`; }
}

function fillKey(k){
  $("keyInput").value=k.key;
  $("typeInput").value=k.type||"custom";
  $("expiresInput").value=toDatetimeLocal(k.expiresAt);
  $("maxDevicesInput").value=k.maxDevices||1;
  $("revokedInput").checked=!!k.revoked;
  window.scrollTo({top:0,behavior:"smooth"});
}

async function saveKey(){
  try{
    await api("/admin/keys",{method:"POST",body:JSON.stringify({
      key:$("keyInput").value.trim(),
      type:$("typeInput").value.trim()||"custom",
      expiresAt:fromDatetimeLocal($("expiresInput").value),
      maxDevices:Number($("maxDevicesInput").value||1),
      revoked:$("revokedInput").checked
    })});
    msg("keyMsg","Đã lưu key");
    loadKeys(); loadStats();
  }catch(e){ msg("keyMsg",e.message,false); }
}

async function deleteKey(key){
  if(!confirm("Xóa key " + key + "?")) return;
  try{ await api("/admin/keys/"+encodeURIComponent(key),{method:"DELETE"}); loadKeys(); loadStats(); }
  catch(e){ alert(e.message); }
}

async function resetDevices(key){
  if(!confirm("Reset toàn bộ thiết bị của key " + key + "?")) return;
  try{ await api("/admin/keys/"+encodeURIComponent(key)+"/devices",{method:"DELETE"}); loadKeys(); if(currentKey===key) loadDevices(key); }
  catch(e){ alert(e.message); }
}

async function loadDevices(key){
  currentKey=key;
  $("deviceTitle").textContent="Key: "+key;
  const tbody=$("devicesBody"); tbody.innerHTML="<tr><td colspan='5'>Đang tải...</td></tr>";
  try{
    const data=await api("/admin/keys/"+encodeURIComponent(key)+"/devices");
    tbody.innerHTML="";
    data.devices.forEach(d=>{
      const tr=document.createElement("tr");
      tr.innerHTML=`<td>${d.id}</td><td>${d.name||"Android Device"}</td><td>${fmt(d.firstUsedAt)}</td><td>${fmt(d.lastUsedAt)}</td><td><button class="danger" data-device="${d.id}">Xóa</button></td>`;
      tbody.appendChild(tr);
    });
    tbody.querySelectorAll("[data-device]").forEach(b=>b.onclick=()=>deleteDevice(key,b.dataset.device));
    if(!data.devices.length) tbody.innerHTML="<tr><td colspan='5'>Chưa có thiết bị.</td></tr>";
  }catch(e){ tbody.innerHTML=`<tr><td colspan='5'>${e.message}</td></tr>`; }
}

async function deleteDevice(key, deviceId){
  if(!confirm("Xóa thiết bị này?")) return;
  try{ await api("/admin/keys/"+encodeURIComponent(key)+"/devices/"+encodeURIComponent(deviceId),{method:"DELETE"}); loadDevices(key); loadKeys(); }
  catch(e){ alert(e.message); }
}

async function loadSettings(){
  try{
    const {settings:s}=await api("/admin/settings");
    ["freeKeyUrl","contactUrl","updateUrl","updateTitle","updateMessage","maintenanceTitle","maintenanceMessage","appLatestVersionCode","appMinVersionCode"].forEach(id=>{ if($(id)) $(id).value=s[id]??""; });
    $("forceUpdate").checked=!!s.forceUpdate;
    $("maintenanceMode").checked=!!s.maintenanceMode;
  }catch(e){ msg("settingsMsg",e.message,false); }
}

async function saveSettings(){
  try{
    await api("/admin/settings",{method:"PUT",body:JSON.stringify({
      freeKeyUrl:$("freeKeyUrl").value.trim(), contactUrl:$("contactUrl").value.trim(), updateUrl:$("updateUrl").value.trim(),
      updateTitle:$("updateTitle").value.trim(), updateMessage:$("updateMessage").value.trim(),
      maintenanceTitle:$("maintenanceTitle").value.trim(), maintenanceMessage:$("maintenanceMessage").value.trim(),
      appLatestVersionCode:Number($("appLatestVersionCode").value||1), appMinVersionCode:Number($("appMinVersionCode").value||1),
      forceUpdate:$("forceUpdate").checked, maintenanceMode:$("maintenanceMode").checked
    })});
    msg("settingsMsg","Đã lưu settings");
  }catch(e){ msg("settingsMsg",e.message,false); }
}

function loadAll(){ loadStats(); loadKeys(); loadSettings(); }

$("loginBtn").onclick=login;
$("adminPassword").addEventListener("keydown",e=>{ if(e.key==="Enter") login(); });
$("logoutBtn").onclick=()=>{ localStorage.removeItem(ADMIN_TOKEN_KEY); showLogin(); };
$("saveKeyBtn").onclick=saveKey;
$("refreshKeysBtn").onclick=()=>{ loadKeys(); loadStats(); };
$("saveSettingsBtn").onclick=saveSettings;

if(token()) showAdmin(); else showLogin();

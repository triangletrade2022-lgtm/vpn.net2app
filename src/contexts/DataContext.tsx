import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { SIPNumber, Carrier, WireGuardConfig, PortConfig, AsteriskConfig, SystemSettings, DashboardStats, Extension, OVHConfig, Tenant, CallRecord, CarrierRate, ServerIp, SmsGatewayConfig, SmsPricing, SmsRecord, SmsCampaign } from '../types';

interface DataContextType {
  tenants: Tenant[]; addTenant: (t: Omit<Tenant, 'id' | 'createdAt' | 'updatedAt'>) => void; updateTenant: (id: string, u: Partial<Tenant>) => void; deleteTenant: (id: string) => void;
  serverIps: ServerIp[]; addServerIp: (ip: Omit<ServerIp, 'id' | 'createdAt'>) => void; updateServerIp: (id: string, u: Partial<ServerIp>) => void; deleteServerIp: (id: string) => void;
  sipNumbers: SIPNumber[]; addSIPNumber: (n: Omit<SIPNumber, 'id' | 'createdAt' | 'updatedAt'>) => void; updateSIPNumber: (id: string, u: Partial<SIPNumber>) => void; deleteSIPNumber: (id: string) => void;
  carriers: Carrier[]; addCarrier: (c: Omit<Carrier, 'id' | 'createdAt' | 'updatedAt'>) => void; updateCarrier: (id: string, u: Partial<Carrier>) => void; deleteCarrier: (id: string) => void;
  carrierRates: CarrierRate[]; addCarrierRate: (r: Omit<CarrierRate, 'id'>) => void; updateCarrierRate: (id: string, u: Partial<CarrierRate>) => void; deleteCarrierRate: (id: string) => void;
  callRecords: CallRecord[]; addCallRecord: (r: Omit<CallRecord, 'id'>) => void;
  wireGuardConfigs: WireGuardConfig[]; addWireGuardConfig: (c: Omit<WireGuardConfig, 'id' | 'createdAt'>) => void; updateWireGuardConfig: (id: string, u: Partial<WireGuardConfig>) => void; deleteWireGuardConfig: (id: string) => void;
  portConfigs: PortConfig[]; addPortConfig: (c: Omit<PortConfig, 'id' | 'lastChecked'>) => void; updatePortConfig: (id: string, u: Partial<PortConfig>) => void; deletePortConfig: (id: string) => void;
  asteriskConfigs: AsteriskConfig[]; addAsteriskConfig: (c: Omit<AsteriskConfig, 'id' | 'createdAt'>) => void; updateAsteriskConfig: (id: string, u: Partial<AsteriskConfig>) => void; deleteAsteriskConfig: (id: string) => void;
  extensions: Extension[]; addExtension: (e: Omit<Extension, 'id' | 'createdAt' | 'updatedAt'>) => void; updateExtension: (id: string, u: Partial<Extension>) => void; deleteExtension: (id: string) => void;
  ovhConfig: OVHConfig | null; updateOVHConfig: (c: Omit<OVHConfig, 'id' | 'createdAt'>) => void;
  settings: SystemSettings | null; updateSettings: (s: Partial<SystemSettings>) => void;
  // SMS
  smsGateways: SmsGatewayConfig[]; addSmsGateway: (g: Omit<SmsGatewayConfig, 'id' | 'createdAt' | 'updatedAt'>) => void; updateSmsGateway: (id: string, u: Partial<SmsGatewayConfig>) => void; deleteSmsGateway: (id: string) => void;
  smsPricing: SmsPricing[]; addSmsPricing: (p: Omit<SmsPricing, 'id'>) => void; updateSmsPricing: (id: string, u: Partial<SmsPricing>) => void; deleteSmsPricing: (id: string) => void;
  smsRecords: SmsRecord[]; addSmsRecord: (r: Omit<SmsRecord, 'id'>) => void;
  smsCampaigns: SmsCampaign[]; addSmsCampaign: (c: Omit<SmsCampaign, 'id' | 'createdAt' | 'updatedAt'>) => void; updateSmsCampaign: (id: string, u: Partial<SmsCampaign>) => void; deleteSmsCampaign: (id: string) => void;
  stats: DashboardStats; refreshStats: () => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);
const gid = () => Math.random().toString(36).substr(2, 9);
const genPass = () => Array.from({ length: 14 }, () => 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$'[Math.floor(Math.random() * 57)]).join('');
const genKey = () => Array.from({ length: 44 }, () => 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/='[Math.floor(Math.random() * 65)]).join('');
const now = () => new Date().toISOString();

// ═══════════════ REAL SERVER IPs ═══════════════
const OVH_MAIN = '51.161.45.126';         // OVH Data Center — MAIN Asterisk server
const BD_RELAY = '103.51.128.9';           // Bangladesh relay VPS (provides BD IP, changeable)
const BD_IPTSP_SIP = '180.210.187.253';    // BD IPTSP carrier SIP server
const BD_IPTSP_USER = '09648472999';
const BD_IPTSP_PASS = '09648472999999';
const WG_OVH_IP = '10.0.0.1';              // OVH WireGuard interface
const WG_BD_IP = '10.100.0.2';             // BD relay WireGuard interface (client to OVH)
const WG_IN_IP = '10.200.0.2';             // India WireGuard interface (client to OVH)
const IN_SBC = '100.64.216.4';

export function DataProvider({ children }: { children: ReactNode }) {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [serverIps, setServerIps] = useState<ServerIp[]>([]);
  const [sipNumbers, setSip] = useState<SIPNumber[]>([]);
  const [carriers, setCar] = useState<Carrier[]>([]);
  const [carrierRates, setCRates] = useState<CarrierRate[]>([]);
  const [callRecords, setCalls] = useState<CallRecord[]>([]);
  const [wireGuardConfigs, setWG] = useState<WireGuardConfig[]>([]);
  const [portConfigs, setPort] = useState<PortConfig[]>([]);
  const [asteriskConfigs, setAst] = useState<AsteriskConfig[]>([]);
  const [extensions, setExt] = useState<Extension[]>([]);
  const [ovhConfig, setOVH] = useState<OVHConfig | null>(null);
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [smsGateways, setSmsG] = useState<SmsGatewayConfig[]>([]);
  const [smsPricing, setSmsP] = useState<SmsPricing[]>([]);
  const [smsRecords, setSmsR] = useState<SmsRecord[]>([]);
  const [smsCampaigns, setSmsC] = useState<SmsCampaign[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem('iptsp_data_v3');
    if (saved) { try { const d = JSON.parse(saved); setTenants(d.tenants||[]); setServerIps(d.serverIps||[]); setSip(d.sipNumbers||[]); setCar(d.carriers||[]); setCRates(d.carrierRates||[]); setCalls(d.callRecords||[]); setWG(d.wg||[]); setPort(d.port||[]); setAst(d.ast||[]); setExt(d.ext||[]); setOVH(d.ovh||null); setSettings(d.settings||null); setSmsG(d.smsGateways||[]); setSmsP(d.smsPricing||[]); setSmsR(d.smsRecords||[]); setSmsC(d.smsCampaigns||[]); } catch { initDefaults(); } }
    else initDefaults();
  }, []);

  useEffect(() => { localStorage.setItem('iptsp_data_v3', JSON.stringify({ tenants, serverIps, sipNumbers, carriers, carrierRates, callRecords, wg:wireGuardConfigs, port:portConfigs, ast:asteriskConfigs, ext:extensions, ovh:ovhConfig, settings, smsGateways, smsPricing, smsRecords, smsCampaigns })); }, [tenants, serverIps, sipNumbers, carriers, carrierRates, callRecords, wireGuardConfigs, portConfigs, asteriskConfigs, extensions, ovhConfig, settings, smsGateways, smsPricing, smsRecords, smsCampaigns]);

  const initDefaults = () => {
    const t1 = 't1', t2 = 't2', t3 = 't3';
    const kOvh = genKey(), kBd = genKey(), kIn = genKey();

    // Tenants — all connect via OVH main IP
    setTenants([
      { id: t1, name: 'IPTSP Bangladesh', company: 'BD Telecom Ltd', email: 'bd@iptsp.com', phone: '+8801700000001', country:'bangladesh', status:'active', maxSipNumbers:100, maxCarriers:5, maxExtensions:50, channelLimit:30, portAllocation:100, rentalAmount:1.50, assignedIp:OVH_MAIN, balance:500, currency:'USD', vpnAccess:true, vpnIp:BD_RELAY, createdAt:now(), updatedAt:now() },
      { id: t2, name: 'IPTSP India', company: 'India Telecom Ltd', email: 'in@iptsp.com', phone: '+919876543210', country:'india', status:'active', maxSipNumbers:100, maxCarriers:5, maxExtensions:50, channelLimit:50, portAllocation:150, rentalAmount:2.00, assignedIp:OVH_MAIN, balance:1000, currency:'USD', vpnAccess:true, vpnIp:'', createdAt:now(), updatedAt:now() },
      { id: t3, name: 'IPTSP World', company: 'Global Telecom', email: 'world@iptsp.com', phone: '+1234567890', country:'world', status:'active', maxSipNumbers:200, maxCarriers:10, maxExtensions:100, channelLimit:100, portAllocation:200, rentalAmount:1.75, assignedIp:OVH_MAIN, balance:2000, currency:'USD', vpnAccess:false, createdAt:now(), updatedAt:now() },
    ]);

    // Server IPs
    setServerIps([
      { id: gid(), ip: OVH_MAIN, label: 'OVH Main Server', type: 'primary', assignedTenantId: null, portSip: 5080, portWg: 51820, status: 'active', maxTenants: 20, currentTenants: 3, createdAt: now() },
      { id: gid(), ip: BD_RELAY, label: 'BD Relay VPS', type: 'secondary', assignedTenantId: null, portSip: 5080, portWg: 51820, status: 'active', maxTenants: 10, currentTenants: 1, createdAt: now() },
    ]);

    setSettings({ id:'1', bangladeshDefaultPort:5080, indiaDefaultPort:5060, wireGuardServerIp:OVH_MAIN, asteriskServerIp:OVH_MAIN, adminEmail:'admin@iptsp.local', timezone:'Asia/Dhaka', sessionTimeout:3600 });

    // WireGuard — OVH is the SERVER, BD and IN are CLIENTS
    setWG([
      { id:gid(), name:'🏠 OVH Main (Server)', country:'bangladesh', interfaceIp:WG_OVH_IP, privateKey:kOvh, publicKey:genKey(), endpoint:`${OVH_MAIN}:51820`, port:51820, allowedIps:['10.0.0.0/24','10.100.0.0/24','10.200.0.0/24'], status:'connected', createdAt:now() },
      { id:gid(), name:'🇧🇩 BD Relay (Client)', country:'bangladesh', interfaceIp:WG_BD_IP, privateKey:kBd, publicKey:genKey(), endpoint:`${BD_RELAY}:51820`, port:51820, allowedIps:['10.100.0.0/24'], status:'connected', createdAt:now() },
      { id:gid(), name:'🇮🇳 India Client', country:'india', interfaceIp:WG_IN_IP, privateKey:kIn, publicKey:genKey(), endpoint:`${OVH_MAIN}:51820`, port:51820, allowedIps:['10.200.0.0/24'], status:'configuring', createdAt:now() },
    ]);

    setPort([
      { id:gid(), country:'bangladesh', port:5080, protocol:'udp', status:'open', latency:45, lastChecked:now(), isRecommended:true },
      { id:gid(), country:'bangladesh', port:5070, protocol:'udp', status:'open', latency:42, lastChecked:now(), isRecommended:true },
      { id:gid(), country:'bangladesh', port:5060, protocol:'udp', status:'blocked', latency:0, lastChecked:now(), isRecommended:false },
      { id:gid(), country:'india', port:5060, protocol:'udp', status:'open', latency:35, lastChecked:now(), isRecommended:true },
    ]);

    setAst([
      { id:gid(), name:'BD IPTSP Peer', context:'iptsp-inbound', host:BD_IPTSP_SIP, port:5080, transport:'udp', qualify:true, nat:true, dtmfMode:'rfc2833', createdAt:now() },
      { id:gid(), name:'India SBC Trunk', context:'india-outbound', host:IN_SBC, port:5060, transport:'udp', qualify:true, nat:false, dtmfMode:'rfc2833', createdAt:now() },
    ]);

    setOVH({ id:gid(), ovhPublicIp:OVH_MAIN, ovhWireGuardPort:51820, ovhInterfaceIp:WG_OVH_IP, bangladeshClientIp:WG_BD_IP, indiaClientIp:WG_IN_IP, bangladeshSubnet:'10.100.0.0/24', indiaSubnet:'10.200.0.0/24', forwardPorts:{sip:5080,rtp:'10000-20000',ami:5038}, status:'running', createdAt:now() });

    // Carriers
    const c1 = gid(), c2 = gid();
    setCar([
      { id:c1, tenantId:t1, name:'BD IPTSP Main', sipServer:BD_IPTSP_SIP, sipPort:5080, username:BD_IPTSP_USER, password:BD_IPTSP_PASS, prefix:'097', suffix:'', e164Format:false, prefixTranslation:'', codecs:'ulaw,alaw,gsm,g729', dtmfMode:'rfc2833', transport:'udp', nat:true, insecure:'port,invite', context:'iptsp-inbound', billingCycle:'per_minute', ratePerMinute:0.02, connectionFee:0, billingIncrement:60, totalMinutes:1250, totalCalls:450, todayMinutes:45, todayCalls:12, lastCallAt:now(), status:'active', connectivityStatus:'verified', lastVerified:now(), createdAt:now(), updatedAt:now() },
      { id:c2, tenantId:t2, name:'India SIP Trunk', sipServer:IN_SBC, sipPort:5060, username:'+914223532220', password:'TrunkPassword', prefix:'0091', suffix:'', e164Format:true, prefixTranslation:'0→0091', codecs:'g729,ulaw,alaw', dtmfMode:'rfc2833', transport:'udp', nat:false, insecure:'invite,port', context:'india-outbound', billingCycle:'per_minute', ratePerMinute:0.015, connectionFee:0.01, billingIncrement:6, totalMinutes:3200, totalCalls:890, todayMinutes:120, todayCalls:35, lastCallAt:now(), status:'active', connectivityStatus:'verified', lastVerified:now(), createdAt:now(), updatedAt:now() },
    ]);

    setCRates([
      { id:gid(), tenantId:t1, carrierId:c1, prefix:'88017', ratePerMinute:0.02, billingIncrement:60, connectionFee:0, effective:'2024-01-01' },
      { id:gid(), tenantId:t1, carrierId:c1, prefix:'88018', ratePerMinute:0.025, billingIncrement:60, connectionFee:0, effective:'2024-01-01' },
      { id:gid(), tenantId:t2, carrierId:c2, prefix:'91', ratePerMinute:0.015, billingIncrement:6, connectionFee:0.01, effective:'2024-01-01' },
    ]);

    setCalls([
      { id:gid(), tenantId:t1, carrierId:c1, callId:'CALL-001', caller:'09648472999', callee:'8801712345678', direction:'outbound', type:'voice', startTime:now(), answerTime:now(), endTime:now(), duration:180, billableDuration:180, ratePerMinute:0.02, totalCost:0.06, carrierName:'BD IPTSP Main', prefix:'88017', status:'answered' },
    ]);

    const extBd = (ext: string, name: string, pw: string) => ({ id:gid(), tenantId:t1, extension:ext, name, password:pw, context:'bangladesh-inbound' as const, nat:true, qualify:true, dtmfMode:'rfc2833' as const, transport:'udp' as const, status:'active' as const, codecs:['ulaw','alaw'] as string[], callerid:`"${name}" <${ext}>`, maxContacts:2, createdAt:now(), updatedAt:now() });
    setExt([
      extBd('2001', 'BD Office 1', '1234'),
      extBd('2002', 'BD Office 2', '1234'),
      extBd('2003', 'BD Office 3', '1234'),
      extBd('2004', 'BD Office 4', '1234'),
      extBd('2005', 'BD Office 5', '1234'),
      extBd('2010', 'BD Manager', '1234'),
    ]);

    const sipBd = (n: string, p: string) => ({ id:gid(), tenantId:t1, number:n, username:n, password:p, sipServer:OVH_MAIN, ipAddress:OVH_MAIN, port:5060, country:'bangladesh' as const, status:'active' as const, connectivityStatus:'verified' as const, lastVerified:now(), prefix:'097', createdAt:now(), updatedAt:now() });
    const sipIn = (n: string, p: string) => ({ id:gid(), tenantId:t2, number:n, username:n, password:p, sipServer:OVH_MAIN, ipAddress:OVH_MAIN, port:5060, country:'india' as const, status:'active' as const, connectivityStatus:'verified' as const, lastVerified:now(), prefix:'0091', createdAt:now(), updatedAt:now() });
    setSip([
      sipBd('09648472999', '09648472999999'),
      sipBd('09648473000', 'pass1234'),
      sipBd('09648473001', 'pass1234'),
      sipBd('09648473002', 'pass1234'),
      sipBd('09648473003', 'pass1234'),
      sipBd('09648473004', 'pass1234'),
      sipBd('09648473005', 'pass1234'),
      sipIn('+914223532220', 'TrunkPassword123'),
    ]);
  };

  const addTenant = (t: Omit<Tenant, 'id'|'createdAt'|'updatedAt'>) => setTenants(p=>[...p,{...t,id:gid(),createdAt:now(),updatedAt:now()}]);
  const updateTenant = (id:string, u:Partial<Tenant>) => setTenants(p=>p.map(t=>t.id===id?{...t,...u,updatedAt:now()}:t));
  const deleteTenant = (id:string) => setTenants(p=>p.filter(t=>t.id!==id));
  const addServerIp = (ip: Omit<ServerIp,'id'|'createdAt'>) => setServerIps(p=>[...p,{...ip,id:gid(),createdAt:now()}]);
  const updateServerIp = (id:string, u:Partial<ServerIp>) => setServerIps(p=>p.map(s=>s.id===id?{...s,...u}:s));
  const deleteServerIp = (id:string) => setServerIps(p=>p.filter(s=>s.id!==id));
  const addSIPNumber = (n: Omit<SIPNumber,'id'|'createdAt'|'updatedAt'>) => setSip(p=>[...p,{...n,id:gid(),password:n.password||genPass(),connectivityStatus:'unchecked',createdAt:now(),updatedAt:now()}]);
  const updateSIPNumber = (id:string, u:Partial<SIPNumber>) => setSip(p=>p.map(n=>n.id===id?{...n,...u,updatedAt:now()}:n));
  const deleteSIPNumber = (id:string) => setSip(p=>p.filter(n=>n.id!==id));
  const addCarrier = (c: Omit<Carrier,'id'|'createdAt'|'updatedAt'>) => setCar(p=>[...p,{...c,id:gid(),connectivityStatus:'unchecked',createdAt:now(),updatedAt:now()}]);
  const updateCarrier = (id:string, u:Partial<Carrier>) => setCar(p=>p.map(c=>c.id===id?{...c,...u,updatedAt:now()}:c));
  const deleteCarrier = (id:string) => setCar(p=>p.filter(c=>c.id!==id));
  const addCarrierRate = (r: Omit<CarrierRate,'id'>) => setCRates(p=>[...p,{...r,id:gid()}]);
  const updateCarrierRate = (id:string, u:Partial<CarrierRate>) => setCRates(p=>p.map(r=>r.id===id?{...r,...u}:r));
  const deleteCarrierRate = (id:string) => setCRates(p=>p.filter(r=>r.id!==id));
  const addCallRecord = (r: Omit<CallRecord,'id'>) => setCalls(p=>[...p,{...r,id:gid()}]);
  const addWireGuardConfig = (c: Omit<WireGuardConfig,'id'|'createdAt'>) => setWG(p=>[...p,{...c,id:gid(),createdAt:now()}]);
  const updateWireGuardConfig = (id:string, u:Partial<WireGuardConfig>) => setWG(p=>p.map(c=>c.id===id?{...c,...u}:c));
  const deleteWireGuardConfig = (id:string) => setWG(p=>p.filter(c=>c.id!==id));
  const addPortConfig = (c: Omit<PortConfig,'id'|'lastChecked'>) => setPort(p=>[...p,{...c,id:gid(),lastChecked:now()}]);
  const updatePortConfig = (id:string, u:Partial<PortConfig>) => setPort(p=>p.map(c=>c.id===id?{...c,...u}:c));
  const deletePortConfig = (id:string) => setPort(p=>p.filter(c=>c.id!==id));
  const addAsteriskConfig = (c: Omit<AsteriskConfig,'id'|'createdAt'>) => setAst(p=>[...p,{...c,id:gid(),createdAt:now()}]);
  const updateAsteriskConfig = (id:string, u:Partial<AsteriskConfig>) => setAst(p=>p.map(c=>c.id===id?{...c,...u}:c));
  const deleteAsteriskConfig = (id:string) => setAst(p=>p.filter(c=>c.id!==id));
  const addExtension = (e: Omit<Extension,'id'|'createdAt'|'updatedAt'>) => setExt(p=>[...p,{...e,id:gid(),createdAt:now(),updatedAt:now()}]);
  const updateExtension = (id:string, u:Partial<Extension>) => setExt(p=>p.map(e=>e.id===id?{...e,...u,updatedAt:now()}:e));
  const deleteExtension = (id:string) => setExt(p=>p.filter(e=>e.id!==id));
  const updateOVHConfig = (c: Omit<OVHConfig,'id'|'createdAt'>) => setOVH(prev=>prev?{...prev,...c}:{...c,id:gid(),createdAt:now()});
  const updateSettings = (s: Partial<SystemSettings>) => setSettings(prev=>prev?{...prev,...s}:null);
  const addSmsGateway = (g: Omit<SmsGatewayConfig,'id'|'createdAt'|'updatedAt'>) => setSmsG(p=>[...p,{...g,id:gid(),createdAt:now(),updatedAt:now()}]);
  const updateSmsGateway = (id:string, u:Partial<SmsGatewayConfig>) => setSmsG(p=>p.map(g=>g.id===id?{...g,...u,updatedAt:now()}:g));
  const deleteSmsGateway = (id:string) => setSmsG(p=>p.filter(g=>g.id!==id));
  const addSmsPricing = (pr: Omit<SmsPricing,'id'>) => setSmsP(prev=>[...prev,{...pr,id:gid()}]);
  const updateSmsPricing = (id:string, u:Partial<SmsPricing>) => setSmsP(p=>p.map(r=>r.id===id?{...r,...u}:r));
  const deleteSmsPricing = (id:string) => setSmsP(p=>p.filter(r=>r.id!==id));
  const addSmsRecord = (r: Omit<SmsRecord,'id'>) => setSmsR(p=>[...p,{...r,id:gid()}]);
  const addSmsCampaign = (c: Omit<SmsCampaign,'id'|'createdAt'|'updatedAt'>) => setSmsC(p=>[...p,{...c,id:gid(),createdAt:now(),updatedAt:now()}]);
  const updateSmsCampaign = (id:string, u:Partial<SmsCampaign>) => setSmsC(p=>p.map(c=>c.id===id?{...c,...u,updatedAt:now()}:c));
  const deleteSmsCampaign = (id:string) => setSmsC(p=>p.filter(c=>c.id!==id));

  const stats: DashboardStats = {
    totalNumbers: sipNumbers.length, activeNumbers: sipNumbers.filter(n=>n.status==='active').length,
    totalCarriers: carriers.length, activeCarriers: carriers.filter(c=>c.status==='active').length,
    wireGuardTunnels: wireGuardConfigs.length, connectedTunnels: wireGuardConfigs.filter(w=>w.status==='connected').length,
    bangladeshNumbers: sipNumbers.filter(n=>n.country==='bangladesh').length, indiaNumbers: sipNumbers.filter(n=>n.country==='india').length,
    totalExtensions: extensions.length, activeExtensions: extensions.filter(e=>e.status==='active').length,
    totalTenants: tenants.length, activeTenants: tenants.filter(t=>t.status==='active').length,
    totalCalls: callRecords.length, todayCalls: callRecords.filter(c=>new Date(c.startTime).toDateString()===new Date().toDateString()).length,
    totalMinutes: Math.round(carriers.reduce((s,c)=>s+c.totalMinutes,0)), todayMinutes: Math.round(carriers.reduce((s,c)=>s+c.todayMinutes,0)),
    totalRevenue: Math.round(callRecords.reduce((s,c)=>s+c.totalCost,0)*100)/100, todayRevenue: Math.round(callRecords.filter(c=>new Date(c.startTime).toDateString()===new Date().toDateString()).reduce((s,c)=>s+c.totalCost,0)*100)/100,
  };

  return (
    <DataContext.Provider value={{ tenants, addTenant, updateTenant, deleteTenant, serverIps, addServerIp, updateServerIp, deleteServerIp, sipNumbers, addSIPNumber, updateSIPNumber, deleteSIPNumber, carriers, addCarrier, updateCarrier, deleteCarrier, carrierRates, addCarrierRate, updateCarrierRate, deleteCarrierRate, callRecords, addCallRecord, wireGuardConfigs, addWireGuardConfig, updateWireGuardConfig, deleteWireGuardConfig, portConfigs, addPortConfig, updatePortConfig, deletePortConfig, asteriskConfigs, addAsteriskConfig, updateAsteriskConfig, deleteAsteriskConfig, extensions, addExtension, updateExtension, deleteExtension, ovhConfig, updateOVHConfig, settings, updateSettings, smsGateways, addSmsGateway, updateSmsGateway, deleteSmsGateway, smsPricing, addSmsPricing, updateSmsPricing, deleteSmsPricing, smsRecords, addSmsRecord, smsCampaigns, addSmsCampaign, updateSmsCampaign, deleteSmsCampaign, stats, refreshStats:()=>{} }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() { const c = useContext(DataContext); if (!c) throw new Error('useData within DataProvider'); return c; }

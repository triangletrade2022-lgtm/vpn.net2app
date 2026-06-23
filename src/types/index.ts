// ═══════════════════════════════════════════════════════════
//  IPTSP Multi-Tenant Platform Types
// ═══════════════════════════════════════════════════════════

export interface User {
  id: string; username: string; email: string;
  role: 'super_admin' | 'tenant_admin' | 'client';
  tenantId?: string;
  balance?: number;
  googleId?: string;
  avatar?: string;
  createdAt: string;
}

export interface ClientRegistration {
  email: string;
  password: string;
  company: string;
  name: string;
  phone: string;
  country: string;
}

export interface Tenant {
  id: string; name: string; company: string; email: string;
  phone: string; country: 'bangladesh' | 'india' | 'pakistan' | 'world';
  status: 'active' | 'inactive' | 'suspended';
  maxSipNumbers: number; maxCarriers: number; maxExtensions: number;
  channelLimit: number;
  portAllocation: number;
  rentalAmount: number;
  balance: number; currency: string;
  assignedIp: string;            // primary IP assigned by super admin
  vpnAccess: boolean; vpnIp?: string;
  createdAt: string; updatedAt: string;
}

export interface ServerIp {
  id: string;
  ip: string;                    // e.g. "103.51.128.9"
  label: string;                 // "Primary BD VPS", "Secondary IP"
  type: 'primary' | 'secondary';
  assignedTenantId: string | null; // which tenant uses this IP (null = unassigned)
  portSip: number;               // SIP port on this IP
  portWg: number;                // WireGuard port
  status: 'active' | 'idle' | 'disabled';
  maxTenants: number;            // how many tenants can share this IP
  currentTenants: number;
  createdAt: string;
}

export interface Carrier {
  id: string; tenantId: string;
  name: string;                // e.g. "BD IPTSP Main"
  sipServer: string;           // e.g. 180.210.187.253
  sipPort: number;             // e.g. 5080
  username: string;            // e.g. 09648472999
  password: string;
  prefix: string;              // "096" or E.164
  suffix: string;              // appended after number
  e164Format: boolean;         // force E.164 +countrycode
  prefixTranslation: string;   // strip/add prefix rule: "0→", "+88→"
  codecs: string;              // "ulaw,alaw,gsm"
  dtmfMode: string;            // "rfc2833"
  transport: 'udp' | 'tcp' | 'tls';
  nat: boolean;
  insecure: string;            // "port,invite"
  context: string;             // "iptsp-inbound"

  // Billing
  billingCycle: 'per_minute' | 'per_6sec' | 'per_second';
  ratePerMinute: number;       // e.g. 0.02 USD/min
  connectionFee: number;       // one-time connect charge
  billingIncrement: number;    // 1, 6, 30, 60 seconds

  // Stats
  totalMinutes: number;
  totalCalls: number;
  todayMinutes: number;
  todayCalls: number;
  lastCallAt?: string;

  status: 'active' | 'inactive';
  connectivityStatus?: 'verified' | 'failed' | 'checking' | 'unchecked';
  lastVerified?: string;
  createdAt: string; updatedAt: string;
}

export interface CarrierRate {
  id: string; tenantId: string; carrierId: string;
  prefix: string;              // "0091", "88017", "+880"
  ratePerMinute: number;
  billingIncrement: number;    // seconds
  connectionFee: number;
  effective: string;           // "2024-01-01"
  expires?: string;
}

export interface CallRecord {
  id: string; tenantId: string; carrierId: string;
  callId: string;              // Asterisk uniqueid
  caller: string;              // source number
  callee: string;              // destination number
  direction: 'inbound' | 'outbound';
  type: 'voice' | 'sms';
  startTime: string;
  answerTime?: string;
  endTime?: string;
  duration: number;            // seconds
  billableDuration: number;    // seconds after rounding
  ratePerMinute: number;
  totalCost: number;
  carrierName: string;
  prefix: string;
  status: 'answered' | 'noanswer' | 'busy' | 'failed' | 'ongoing';
  hangupCause?: string;
  recordingFile?: string;
}

export interface SIPNumber {
  id: string; tenantId: string;
  number: string; username?: string; password?: string;
  sipServer?: string; ipAddress: string; port: number;
  country: 'bangladesh' | 'india';
  status: 'active' | 'inactive' | 'pending';
  connectivityStatus?: 'verified' | 'failed' | 'checking' | 'unchecked';
  lastVerified?: string;
  prefix: string;
  carrierId?: string;
  createdAt: string; updatedAt: string;
}

export interface BulkSIPEntry {
  number: string; username: string; password: string;
  sipServer: string; host: string; port: number;
  prefix: string; status: 'active' | 'inactive' | 'pending';
}

export interface WireGuardConfig {
  id: string; name: string; country: 'bangladesh' | 'india';
  interfaceIp: string; privateKey: string; publicKey: string;
  endpoint: string; port: number; allowedIps: string[];
  status: 'connected' | 'disconnected' | 'configuring';
  createdAt: string;
}

export interface PortConfig {
  id: string; country: 'bangladesh' | 'india';
  port: number; protocol: 'udp' | 'tcp';
  status: 'open' | 'closed' | 'blocked';
  latency: number; lastChecked: string; isRecommended: boolean;
}

export interface AsteriskConfig {
  id: string; name: string; context: string;
  host: string; port: number; transport: 'udp' | 'tcp' | 'tls';
  qualify: boolean; nat: boolean; dtmfMode: 'rfc2833' | 'info' | 'auto';
  createdAt: string;
}

export interface Extension {
  id: string; tenantId: string;
  extension: string; name: string; password: string;
  email?: string;
  context: 'bangladesh-inbound' | 'india-outbound' | 'default';
  nat: boolean; qualify: boolean;
  dtmfMode: 'rfc2833' | 'info' | 'auto';
  transport: 'udp' | 'tcp' | 'tls';
  status: 'active' | 'inactive';
  codecs: string[]; callerid: string; maxContacts: number;
  createdAt: string; updatedAt: string;
}

export interface SystemSettings {
  id: string;
  bangladeshDefaultPort: number; indiaDefaultPort: number;
  wireGuardServerIp: string; asteriskServerIp: string;
  adminEmail: string; timezone: string; sessionTimeout: number;
}

export interface OVHConfig {
  id: string; ovhPublicIp: string; ovhWireGuardPort: number;
  ovhInterfaceIp: string;
  bangladeshClientIp: string; indiaClientIp: string;
  bangladeshSubnet: string; indiaSubnet: string;
  forwardPorts: { sip: number; rtp: string; ami: number };
  status: 'running' | 'stopped'; createdAt: string;
}

// ═══════════════════════════════════════════════════════════
//  SMS Types
// ═══════════════════════════════════════════════════════════

export type SmsChannel =
  | 'sms'           // Standard SMS (SMPP/HTTP)
  | 'smpp'          // SMPP protocol direct
  | 'http'          // HTTP API
  | 'voice_otp'     // Voice OTP call
  | 'ott'           // Over-The-Top messaging
  | 'rcs'           // Rich Communication Services
  | 'flash'         // Flash SMS (Class 0)
  | 'whatsapp'      // Official WhatsApp Business API
  | 'telegram';     // Telegram Bot API

export const SMS_CHANNELS: { key: SmsChannel; label: string; icon: string; desc: string }[] = [
  { key: 'sms', label: 'SMS', icon: '💬', desc: 'Standard SMS (SMPP/HTTP)' },
  { key: 'smpp', label: 'SMPP', icon: '🔌', desc: 'SMPP Protocol Direct' },
  { key: 'http', label: 'HTTP API', icon: '🌐', desc: 'HTTP API Integration' },
  { key: 'voice_otp', label: 'Voice OTP', icon: '📞', desc: 'Voice OTP Call' },
  { key: 'ott', label: 'OTT', icon: '📱', desc: 'Over-The-Top Messaging (iMessage, Viber, etc.)' },
  { key: 'rcs', label: 'RCS', icon: '💎', desc: 'Rich Communication Services' },
  { key: 'flash', label: 'Flash SMS', icon: '⚡', desc: 'Flash SMS (Class 0, pops up on screen)' },
  { key: 'whatsapp', label: 'WhatsApp', icon: '💚', desc: 'Official WhatsApp Business API' },
  { key: 'telegram', label: 'Telegram', icon: '✈️', desc: 'Telegram Bot API' },
];

export interface SmsGatewayConfig {
  id: string;
  provider: 'net2app' | 'custom';
  name: string;
  apiEndpoint: string;
  apiKey: string;
  senderId: string;
  enabled: boolean;
  defaultCountry: string;
  enabledChannels: SmsChannel[];
  createdAt: string; updatedAt: string;
}

export interface SmsPricing {
  id: string;
  channel: SmsChannel;
  country: string;
  countryCode: string;
  ratePerUnit: number;
  enabled: boolean;
}

export interface SmsRecord {
  id: string;
  tenantId: string;
  clientId?: string;
  channel: SmsChannel;
  sender: string;
  recipient: string;
  message: string;
  segments: number;
  cost: number;
  status: 'sent' | 'delivered' | 'failed' | 'pending';
  gateway: string;
  createdAt: string;
}

export interface SmsCampaign {
  id: string;
  name: string;
  channel: SmsChannel;
  message: string;
  recipients: string[];
  totalRecipients: number;
  sentCount: number;
  failedCount: number;
  status: 'draft' | 'sending' | 'completed' | 'cancelled';
  cost: number;
  createdBy: string;
  createdAt: string; updatedAt: string;
}

export interface DashboardStats {
  totalNumbers: number; activeNumbers: number;
  totalCarriers: number; activeCarriers: number;
  wireGuardTunnels: number; connectedTunnels: number;
  bangladeshNumbers: number; indiaNumbers: number;
  totalExtensions: number; activeExtensions: number;
  totalTenants: number; activeTenants: number;
  totalCalls: number; todayCalls: number;
  totalMinutes: number; todayMinutes: number;
  totalRevenue: number; todayRevenue: number;
}

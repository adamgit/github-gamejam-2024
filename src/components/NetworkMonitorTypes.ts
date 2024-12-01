export interface ScannedServerInfo {
    id: string;
    address: string;
    pingLatency: number | null;
    openPorts: string[] | null;
    osType: string | null;
    encryptionLevel: 'Low' | 'Medium' | 'High' | null;
    discoveryTime: number;
    status: 'hackable' | 'potential' | 'secure' | 'unknown';
  }
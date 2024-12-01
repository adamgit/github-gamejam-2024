// utils/serverUtils.ts
import { ServerLoginService } from '../backgroundservices/serverservices/service-login';
import { RemoteHost } from '../data/HostConnection';
import { ScannedServerInfo } from './NetworkMonitorTypes';

export const convertToScannedInfo = (host: RemoteHost): ScannedServerInfo => {
  const determineStatus = (host: RemoteHost): ScannedServerInfo['status'] => {
    if (host.service(ServerLoginService)) return 'potential';
    return 'unknown';
  };

  return {
    id: Math.random().toString(36).substr(2, 9),
    address: host.fqdn,
    pingLatency: Math.floor(Math.random() * 200),
    openPorts: null,
    osType: null,
    encryptionLevel: null,
    discoveryTime: Date.now(),
    status: determineStatus(host),
  };
};
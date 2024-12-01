// services/service-passwords.ts
import { RemoteHost } from '../../data/HostConnection';
import { HostResolver } from '../../data/HostResolver';
import { ServerLoginService } from '../serverservices/service-login';
import { SubscribableEvent } from '../subscribable-event';
//import { getMissionOS } from '../../missionsystem/OSForMissions';
import { getFailableMissionOS } from '../../missionsystem/OSForMissions';

export type PasswordStatus = 'confirmed' | 'unconfirmed' | 'invalid';

export interface PasswordEntry {
  username: string;
  password: string | null | undefined;
  status: PasswordStatus;
}

export class PasswordsService {
  private data: Record<string, PasswordEntry[]> = {};
  public readonly onPasswordEntryAdded: SubscribableEvent<[string, PasswordEntry]>;
  public readonly onPasswordEntryUpdated: SubscribableEvent<[string, PasswordEntry]>;
  public readonly onNewHostEntered: SubscribableEvent<[string]>;

  constructor() {
    this.onPasswordEntryAdded = new SubscribableEvent('onPasswordEntryAdded');
    this.onPasswordEntryUpdated = new SubscribableEvent('onPasswordEntryUpdated');
    this.onNewHostEntered = new SubscribableEvent('onNewHostEntered');

    /** Workaround Javascript's poor handling of function-references; 'this' is not preserved when you send a fn-ref UNLESS you do this horrible .bind() syntax */
    this.callbackLoginSucceeded = this.callbackLoginSucceeded.bind(this);
    this.callbackLoginFailed = this.callbackLoginFailed.bind(this);
  
    // Subscribe to HostResolver events
    const hostResolver = HostResolver.getInstance();
    hostResolver.onHostAdded.addListener(this.handleHostAdded.bind(this));
  
    // Hook into all existing hosts at initialization
    this.hookExistingHosts();
  }

  private hookExistingHosts(): void {
    console.log(`PasswordsService hooking into all existing hosts...`);
    const hostResolver = HostResolver.getInstance();
    const existingHosts = hostResolver.getAllHosts();

    for (const host of existingHosts) {
      this.handleHostAdded(host); // Reuse the existing hooking logic
    }
  }

  private handleHostAdded(host: RemoteHost): void {
    console.log(`PasswordsService detected new host: ${host.fqdn}`);

    // Check if the host provides a login service
    const loginService = host.service(ServerLoginService) as ServerLoginService | undefined;

    if (loginService) {
      console.log(`Hooking into login service on host: ${host.fqdn}`);
      loginService.onLoginSuccess.addListener( this.callbackLoginSucceeded ); // requires you to have done .bind(this) at some point earlier in class
      loginService.onLoginFailure.addListener( this.callbackLoginFailed ); // requires you to have done .bind(this) at some point earlier in class
    }
  }

  private callbackLoginSucceeded(username:string, password:string, hostname:string)
  {
    console.log(`login SUCCESS will add/update password '${password}' for username '${username}'`)
    this.addOrUpdatePassword(hostname, username, password, 'confirmed' );
  }
  private callbackLoginFailed(username:string, password:string, hostname:string)
  {
    console.log(`login FAILED will add/update password '${password}' for username '${username}'`)
    this.addOrUpdatePassword(hostname, username, password, 'invalid' );
  }


  public addOrUpdatePassword(
    hostname: string,
    username: string,
    password: string | null | undefined,
    status: PasswordStatus = 'unconfirmed'
  ): void {
    if (!this.data[hostname]) {
      this.data[hostname] = [];
    }

    const hasConfirmedEntry = this.data[hostname].some((entry) => entry.status === 'confirmed');
    if (!hasConfirmedEntry) {
      console.log("Player just entered a new host for the very first time: "+hostname);
      this.onNewHostEntered.invoke(hostname);

      getFailableMissionOS()?.repService?.alterReputation( Math.floor(1 + Math.random()*3));
    }

    const existingEntry = this.data[hostname].find((entry) => entry.username === username);

    if (existingEntry) {
      if (
        existingEntry.password === password &&
        existingEntry.status === status
      ) {
        // No effect if username/password/status is the same
        return;
      }
      existingEntry.password = password;
      existingEntry.status = status;
      this.onPasswordEntryUpdated.invoke(hostname, existingEntry);
    } else {
      const newEntry: PasswordEntry = { username, password, status };
      this.data[hostname].push(newEntry);
      this.onPasswordEntryAdded.invoke(hostname, newEntry);
    }
  }

  public markAsConfirmed(hostname: string, username: string): void {
    this.updateStatus(hostname, username, 'confirmed');
  }

  public markAsInvalid(hostname: string, username: string): void {
    this.updateStatus(hostname, username, 'invalid');
  }

  private updateStatus(hostname: string, username: string, status: PasswordStatus): void {
    const entry = this.data[hostname]?.find((entry) => entry.username === username);
    if (entry && entry.status !== status) {
      entry.status = status;
      this.onPasswordEntryUpdated.invoke(hostname, entry);
    }
  }

  public getPasswords(): Record<string, PasswordEntry[]> {
    return this.data;
  }
}

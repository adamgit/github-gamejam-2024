import { Login } from '@mui/icons-material';
import { AttemptsTracker } from './AttemptsTracker';
import { SubscribableEvent } from '../subscribable-event';
import { RemoteHost } from '../../data/HostConnection';
import { OperatingSystem } from '../../data/OperatingSystem';
import { SystemLogService } from './service-syslog';

interface LoginAttempt {
  username: string;
}

interface UserCredentials {
  username: string;
  password: string;
}

/**
 * Base login service that provides core login functionality
 * without additional security features
 * 
 * NOTE: all subclasses MUST invoke handleSucceededLogin / handleFailedLogin,
 * these are used both for core logic in the game, and also for cosmetic
 * gameplay features in the UI
 */
export class ServerLoginService {
  protected attachedHost: RemoteHost;

  public onLoginFailure: SubscribableEvent<[string,string,string]>;
  public readonly onLoginSuccess: SubscribableEvent<[string,string,string]>;

  constructor( server: RemoteHost ) {
    this.attachedHost = server;
    this.onLoginFailure = new SubscribableEvent<[string,string,string]>("onLoginFailure");
    this.onLoginSuccess = new SubscribableEvent<[string,string,string]>("onLoginSuccess");
  }

  attemptLogin(username: string, password: string): boolean {
    // Base class provides a simple failed login event but no actual authentication
    // Subclasses should override this to implement actual authentication
    this.onLoginFailure?.invoke(username,password,this.attachedHost.fqdn);
    return false;
  }

  protected handleSucceededLogin(username:string,password:string):void
  {
    this.onLoginSuccess?.invoke(username,password,this.attachedHost.fqdn);
  }
  protected handleFailedLogin(username:string,password:string):void
  {
    this.onLoginFailure?.invoke(username,password,this.attachedHost.fqdn);
  }
}

/**
 * Login service that implements lockout after failed attempts
 * and tracks failed logins
 */
export class SecureLoginService extends ServerLoginService {
  protected trackFailedLogins: AttemptsTracker<LoginAttempt>;
  public onAccountLockout: SubscribableEvent<[string]>;

  constructor( server: RemoteHost ) {
    super(server);
    this.onAccountLockout = new SubscribableEvent<[string]>("onAccountLockout");
    this.trackFailedLogins = new AttemptsTracker<LoginAttempt>({
      maxAttempts: 3,
      windowSeconds: 60,
      lockoutCallback: (credentials) => this.onAccountLockout.invoke(credentials.username),
    });
  }

  protected handleFailedLogin(username: string,password:string): void {
    super.handleFailedLogin(username,password);
    this.trackFailedLogins.recordAttempt({ username: username });
  }
}

/**
 * Simple login service where username must equal password
 * Includes security features from SecureLoginService
 */
export class NameEqualsPasswordLoginService extends SecureLoginService {
  constructor( server: RemoteHost ) {
    super(server);
  }

  attemptLogin(username: string, password: string): boolean {
    if (username === 'root' || username !== password) {
      console.log("This loginservice always rejects 'root' logins, deliberately")
      console.log("failed login, sending: "+username)
      this.handleFailedLogin(username,password);
      return false;
    }
    console.log("success login, sending: "+username)
    this.handleSucceededLogin(username,password);
    return true;
  }
}

/**
 * Login service with predefined valid username/password pairs
 * Includes security features from SecureLoginService
 */
export class CredentialStoreLoginService extends SecureLoginService {
  private validCredentials: Map<string, string>;

  constructor(credentials: UserCredentials[], server: RemoteHost ) {
    super( server );
    this.validCredentials = new Map(
      credentials.map(cred => [cred.username, cred.password])
    );
  }

  attemptLogin(username: string, password: string): boolean {
    const storedPassword = this.validCredentials.get(username);
    
    if (!storedPassword || storedPassword !== password) {
      this.handleFailedLogin(username,password);
      return false;
    }
 
    this.handleSucceededLogin(username,password);
    return true;
  }

  configureAddUserAccount( newUser: UserCredentials )
  {
    this.validCredentials.set(newUser.username, newUser.password);
  }

  replacePassword( username: string, password: string): void
  {
    if( this.validCredentials.has(username) )
    {
      this.validCredentials.set(username,  password);
      console.log('[service] subclass of -login-: password changed for: '+username+' / '+password)

      const syslogd = this.attachedHost.service( SystemLogService );
      if( syslogd )
      {
        syslogd.logEvent( 'password-change', 'new password for user: '+username );
      }
    }
    else
    {
      console.log('[service] subclass of -login-: FAILED to change password for non-existent user: '+username+'; known users: '+Array.from(this.validCredentials.keys()));
    }
  }
}
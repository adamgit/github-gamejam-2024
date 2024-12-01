import { Shell } from "./Shell";

type OutputCallback = (message: string) => void
type OverwriteInputBufferCallback = (message: string) => void
type EnvironmentUpdateCallback = () => void;  // Simple trigger for re-render

export interface LoggedInUser {
    readonly id: string;
    readonly groups: ReadonlyArray<string>;
    readonly effectiveId?: string;
}

// Types for services
export interface ServiceInstance {
    [key: string]: any;  // To allow .invoke() etc on found services
  }  
  interface ServiceConstructor<T extends ServiceInstance> {
    new(...args: any[]): T;
  }
// Type for the services configuration on a host
export type HostServices = Record<string, ServiceInstance>;

// The RemoteHost class represents the server.
// This class is immutable once created.
export class RemoteHost {
    fqdn: string;
    shell: Shell;
    private services: Record<string, ServiceInstance> = {}

    constructor(fqdn, shell) {
        this.fqdn = fqdn; // Immutable hostname
        this.shell = shell; // Immutable shell script that is executed per session
    }

    registerService(name: string, service: ServiceInstance) {
        this.services[name] = service;
        return this; // For chaining if desired
      }
    
    service<T extends ServiceInstance>(type: ServiceConstructor<T>): T {
        const matches = Object.values(this.services)
          .filter(svc => svc instanceof type);
    
        if (matches.length === 0)
            {
                console.warn(`No match found for type: ${type} ... type.name: ${type.name} in host ${this.fqdn}`)
                return undefined;
            }
        if (matches.length > 1) {
          throw new Error(`Multiple services of type ${type.name} found on host ${this.fqdn}`);
        }
    
        return matches[0] as T;
      }

      /** Only for use by missions, that use the short-name, instead of the classname */
      serviceByName( shortname : string ): any {
        return this.services[shortname];
      }

      debugListAllServices(): string
      {
        var result = "";
        for( const serviceName in this.services )
        {
            result += serviceName+"\n";
        }
        return result;
      }

    /** Method to create a new RemoteSession
     * 
     * NOTE: this deliberately creates WITHOUT a callback for the session to output to local terminal;
     * you MUST separately call "attachLocalConsole" and give it a function(string) - but you SHOULD do
     * that asynch after the invoking React component has NOT ONLY finished mounting BUT ALSO finished
     * updating local state with side-effects of finishing mounting.
     * 
     * (to be clear: React doesnt just render() and mount, it does MULTI LAYER mounting even within
     * a single non-nested component - EVERYTHING is asynch even when it has NO REASON to be - and
     * artificially so - which causes data-corruption errors everywhere, unless you write a large
     * number of repeated copy/pasta useEffect calls, each one chaining from the previous. Yes,
     * really - ugly over-verbose and unnecessary, but at least its obvious what it means)
*/
    createNewSession() : RemoteSession
    {
        return new RemoteSession(this);
    }
}

export interface EnvironmentVariables {
    [key: string]: string;
}

/**
 * One of these is created for each Terminal instance, and destroyed when the terminal disconnects / terminal-window is closed
 */
export class RemoteSession {
    private suspended: boolean = false;
    private whileSuspendedEnvironmentChanged: boolean = false;
    private static sessionCounter = 0
    host: RemoteHost
    protected sessionId: number
    protected state: string
    readonly environmentVariables: EnvironmentVariables = {};
    protected localSysOut!: OutputCallback | null
    protected localOverwriteInputBuffer!: OverwriteInputBufferCallback | null
    protected localChangedEnvVariables: EnvironmentUpdateCallback | null

    user?: LoggedInUser;

    /** Allows the server to disconnect the client */
    private onForceDisconnect?: () => void;
 
    constructor(remoteHost: RemoteHost) {
        this.host = remoteHost
        this.sessionId = ++RemoteSession.sessionCounter
        this.state = 'connected'
    }
 
    attachLocalConsole(newSysOut: OutputCallback, setInputBuffer: OverwriteInputBufferCallback, onEnvironmentUpdate: EnvironmentUpdateCallback, onForceDisconnect: () => void): void
    {
        console.log("Attach local console was called ... will issue shell.connected, after hooking things up");

        this.localSysOut = newSysOut
        this.localOverwriteInputBuffer = setInputBuffer;
        this.localChangedEnvVariables = onEnvironmentUpdate;
        this.onForceDisconnect = onForceDisconnect;
        
        
        {
            this.sendOutput(`Connected. (Host: ${this.host.fqdn})`)
        }

        this.host.shell.connected(this);

        console.log(`new console connected to this RemoteSession; env-vars: ${JSON.stringify(this.environmentVariables)}`)
    }

    disconnectClient(): void {
        this.onForceDisconnect?.();
      }

    suspendCallbacks() {
        this.suspended = true;
        this.whileSuspendedEnvironmentChanged = false;
      }
    
      resumeCallbacks() {
        this.suspended = false;
        if( this.whileSuspendedEnvironmentChanged )
            this.localChangedEnvVariables?.();
      }

    // Method for shell to update environment variables
    setEnvironmentVariableIfUnset(key: string, value: string): void {
        if( !this.environmentVariables[key])
        {
        this.environmentVariables[key] = value;
        
        if( !this.suspended )
        this.localChangedEnvVariables?.();
    else
    this.whileSuspendedEnvironmentChanged = true;
        }
    }
    setEnvironmentVariable(key: string, value: string): void {
        this.environmentVariables[key] = value;
        
        if( !this.suspended )
        this.localChangedEnvVariables?.();
    else
    this.whileSuspendedEnvironmentChanged = true;
    }

    removeEnvironmentVariable(key: string): void {
        delete this.environmentVariables[key];
        
        if( !this.suspended )
        this.localChangedEnvVariables?.();
        else
        this.whileSuspendedEnvironmentChanged = true;
    }

    sendOutput(message: string): void {
        if (this.localSysOut) {
            this.localSysOut(message)
        } else {
            console.log(`WARNING: message sent to disconnected session. State = ${this.state}`)
        }
    }

    setInputBuffer( newBuffer: string ): void
    {
        if( ! this.suspended )
        this.localOverwriteInputBuffer?.(newBuffer);
    }
 
    clientDisconnected(): void {
        this.localSysOut = null
        this.localOverwriteInputBuffer = null
        this.state = 'disconnected (no client)'
    }
 
    executeCommand(command: string): void {
        this.host.shell.executeCommand(command, this);
    }

    tabPressed( currentInputBuffer: string, caretPosition: number, isSecondTab:boolean): void
    {
        this.host.shell.handleTab( currentInputBuffer, caretPosition, isSecondTab, this);
    }

    cursorUpPressed( currentInputBuffer: string, caretPosition: number): void
    {
        this.host.shell.handleCursorUp( currentInputBuffer, caretPosition, this );
    }
    cursorDownPressed( currentInputBuffer: string, caretPosition: number): void
    {
        this.host.shell.handleCursorDown( currentInputBuffer, caretPosition, this );
    }
 }
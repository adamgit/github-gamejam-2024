import { ServerLoginService } from '../backgroundservices/serverservices/service-login';
import { RemoteSession } from './HostConnection';
import { BaseShell, Shell } from './Shell';

export class TrivialShell extends BaseShell implements Shell
{
    constructor() { super('TrivialShell')}
 
    connected(session: RemoteSession): void
    {
        session.setEnvironmentVariableIfUnset('PWD', '/' );
    }
    async executeCommand(command: string, session:RemoteSession): Promise<void>
    {
        if( !this.checkBuiltinCommands(command, session))
        {
        if (command === 'whoami') {
            session.sendOutput(`You are logged in as --- who knows? I don't implement that yet ahahahahahaha`);
        }
    }
    }
    handleCursorUp(inputBuffer: string, cursorPosition: number, session: RemoteSession): void {}
    handleCursorDown(inputBuffer: string, cursorPosition: number, session: RemoteSession): void {}
    handleTab( inputBuffer: string, cursorPosition: number, isSecondTab:boolean, session: RemoteSession): void {}
}

export class EchoingShell extends BaseShell implements Shell
{
    constructor() { super('EchoingShell');}
 
    connected(session: RemoteSession): void 
    {
        session.setEnvironmentVariableIfUnset('PWD', '/' );
    }
    async executeCommand(command: string, session:RemoteSession): Promise<void>
    {
        if( !this.checkBuiltinCommands(command, session))
        session.sendOutput("You said:"+ command);
    }
    handleCursorUp(inputBuffer: string, cursorPosition: number, session: RemoteSession): void {}
    handleCursorDown(inputBuffer: string, cursorPosition: number, session: RemoteSession): void {}
    handleTab( inputBuffer: string, cursorPosition: number, isSecondTab:boolean, session: RemoteSession): void {}
}

export class SimpleLoginShell extends BaseShell implements Shell
{
    hasUsername: boolean;
    hasPassword: boolean;

    isLoggedIn: boolean;

    attemptingUsername: string;
    attemptingPassword: string;

    constructor()
    {
        super('SimpleLoginShell');
        this.isLoggedIn = false;
    }
 
    connected(session: RemoteSession): void
    {
        //session.sendOutput(`login:`);
        session.setEnvironmentVariable("PROMPT_OVERRIDE", "login:");
        session.setEnvironmentVariableIfUnset('PWD', '/' );
    }

    private attemptLogin( username: string, password: string ) : boolean
    {
        return true;
    }

    async executeCommand(command: string, session:RemoteSession): Promise<void>
    {
        if( ! this.isLoggedIn )
        {
            if( !this.hasUsername )
            {
            // interpret as username
            this.attemptingUsername = command;
            this.hasUsername = true;
            
            //session.sendOutput("password:");
            session.setEnvironmentVariable("PROMPT_OVERRIDE", "password:");

            }
            else if( !this.hasPassword )
            {
                this.attemptingPassword = command;
                this.hasPassword = true;

                console.log( `has username: ${this.hasUsername}, has password ${this.hasPassword}, attempting login`);

                if( this.attemptLogin(this.attemptingUsername, this.attemptingPassword))
                {
                    this.isLoggedIn = true;
                    session.setEnvironmentVariable( "username", this.attemptingUsername );
                    session.removeEnvironmentVariable("PROMPT_OVERRIDE" );
                }
                else
                {
                    session.sendOutput("Incorrect name or password");
                    session.setEnvironmentVariable("PROMPT_OVERRIDE", "login:" );
                    this.hasUsername = this.hasPassword = false;
                }
            }
        }
        else
        {
            //if( !this.checkBuiltinCommands(command, session))
            this.checkBuiltinCommands(command, session);
        }
        
    }
    
    handleCursorUp(inputBuffer: string, cursorPosition: number, session: RemoteSession): void {}
    handleCursorDown(inputBuffer: string, cursorPosition: number, session: RemoteSession): void {}
    handleTab( inputBuffer: string, cursorPosition: number, isSecondTab:boolean, session: RemoteSession): void {}
}

type AttemptedLoginDetails =
    {
        attemptingUsername: string;
        attemptingPassword: string;    
    }
export class LoginWrapperShell extends BaseShell implements Shell
{
    private static readonly sessionData = new WeakMap<RemoteSession, AttemptedLoginDetails>();

    authenticatedShell: Shell;

    constructor( shellToHandoverTo: Shell)
    {
        super('SimpleLoginShell');
        this.authenticatedShell = shellToHandoverTo;
    }
 
    connected(session: RemoteSession): void
    {
        var initial : AttemptedLoginDetails = {attemptingUsername:null, attemptingPassword:null};
        LoginWrapperShell.sessionData.set(session, initial );

        //session.sendOutput(`login:`);
        session.setEnvironmentVariable("PROMPT_OVERRIDE", "login:");
    }

    private attemptLogin(session:RemoteSession, username:string, password:string) : boolean
    {
        const pamService = session.host.service(ServerLoginService);
        if( !pamService )
        {
            console.error(`No service found of type 'ServerLoginService' on host: ${session.host}`)
        }
        
        return pamService.attemptLogin( username, password);
    }

    async executeCommand(command: string, session:RemoteSession): Promise<void>
    {
        if( ! session.user )
        {
            if( !LoginWrapperShell.sessionData.get(session).attemptingUsername )
            {
            // interpret as username
            LoginWrapperShell.sessionData.get(session).attemptingUsername = command;
            
            //session.sendOutput("password:");
            session.setEnvironmentVariable("PROMPT_OVERRIDE", "password:");

            }
            else if( !LoginWrapperShell.sessionData.get(session).attemptingPassword )
            {
                LoginWrapperShell.sessionData.get(session).attemptingPassword = command;

                //console.log( `has username: ${this.hasUsername}, has password ${this.hasPassword}, attempting login`);

                const username = LoginWrapperShell.sessionData.get(session).attemptingUsername;
                const password = LoginWrapperShell.sessionData.get(session).attemptingPassword;
                if( this.attemptLogin(session, username, password ))
                {
                    session.user = {
                        id: username,
                        groups: [],
                    }
                    session.removeEnvironmentVariable("PROMPT_OVERRIDE" );
                    session.setEnvironmentVariable( "username", username );
                    this.authenticatedShell.connected(session);
                }
                else
                {
                    session.sendOutput("Incorrect name or password");
                    session.setEnvironmentVariable("PROMPT_OVERRIDE", "login:" );
                    LoginWrapperShell.sessionData.set(session, {attemptingUsername:null, attemptingPassword:null} );
                }
            }
        }
        else
        {
            return this.authenticatedShell.executeCommand( command, session);
        }
        
    }
    
    handleCursorUp(inputBuffer: string, cursorPosition: number, session: RemoteSession): void
    {
        if( session.user )
            this.authenticatedShell.handleCursorUp( inputBuffer, cursorPosition, session);
    }
    handleCursorDown(inputBuffer: string, cursorPosition: number, session: RemoteSession): void
    {
        if( session.user )
            this.authenticatedShell.handleCursorDown( inputBuffer, cursorPosition, session);
    }

    handleTab( inputBuffer: string, cursorPosition: number, isSecondTab:boolean, session: RemoteSession): void
    {
        if( session.user )
            this.authenticatedShell.handleTab( inputBuffer, cursorPosition, isSecondTab, session);
    }
}
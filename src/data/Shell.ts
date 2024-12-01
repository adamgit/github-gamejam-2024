import { RemoteSession } from './HostConnection';

export interface Shell
 {
    connected( session: RemoteSession ): void;
    executeCommand(command: string, session:RemoteSession): void;

    handleCursorUp( inputBuffer: string, cursorPosition: number, session: RemoteSession): void;
    handleCursorDown( inputBuffer: string, cursorPosition: number, session: RemoteSession): void;
    handleTab( inputBuffer: string, cursorPosition: number, isSecondTab:boolean, session: RemoteSession): void;
 }

export class BaseShell
{
    shellName: string;
    constructor( shellName: string) { this.shellName = shellName;}
 
    checkBuiltinCommands(command: string, session:RemoteSession): boolean
    {
        if (command === 'shellinfo') {
            session.sendOutput(`This Shell's info: ${this.shellName}`);
            return true;
        }
        return false;
    }
}
import { RemoteSession } from '../HostConnection';
import { anonymousUser } from '../../filesystem/filesystem';
import { DefaultBinaryExecutor } from './DefaultBinaryExecutor';
import { CredentialStoreLoginService } from '../../backgroundservices/serverservices/service-login';

export class passwd extends DefaultBinaryExecutor {
    async execute(args: string[], session: RemoteSession): Promise<void> {
    
    if (args.length !== 1) {
        session.sendOutput("usage: passwd <new-password>");
        return;
    }

    const effectiveUser = session.user ?? anonymousUser;
    const newPassword = args[0];

    const changeableLoginService = session.host.service(CredentialStoreLoginService);
    if( !changeableLoginService )
    {
        console.warn(`[shellbinary:passwd] attempted to change username/password on a host (${session.host.fqdn}) that has no login-services I recognise, only support CredentialStoreLoginService right now`);
        session.sendOutput(`Error: can't change passwords on this system`);
    }
    else
    {
        changeableLoginService.replacePassword(effectiveUser.id,newPassword);
        session.sendOutput("User password changed, relogin");
            await new Promise(resolve => setTimeout(resolve, 500));
            session.disconnectClient();
    }
}
}
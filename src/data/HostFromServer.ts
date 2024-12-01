import { RemoteHost } from './HostConnection';
import { ScenarioServer } from '../servergensystem/ScenarioServer';
import { LoginWrapperShell } from './shells';
import { BashShell } from './BashShell';
import { anonymousUser, FileSystem } from '../filesystem/filesystem';
import { ServerAccount } from '../servergensystem/types';
import { HostResolver } from './HostResolver';
import { CredentialStoreLoginService, NameEqualsPasswordLoginService } from '../backgroundservices/serverservices/service-login';
import { FSInit_createFileImpl_IgnorePermissions, FSInit_createFolderImpl_IgnorePermissions } from '../filesystem/operations/create';
import { Path } from '../filesystem';
import { FileSystemFolder } from '../filesystem/types/internalnodes';

/**
 * Allows us to setup complex chains of interdependent data and secrets using placeholder
 * ScenarioServer objects, and then finally create a set of RemoteHost live hosts from those
 * placeholders.
 */
export class HostFromServer
{
    /**
     * Converts a generated Server into a fully configured RemoteHost
     * 
     * NOTE: automatically chooses a CredentialStoreLoginService to use for the
     * logins and password-mgmt; if you need to change that, you'll have to provide some other mechanism
     * that's procedural
     * 
     * @param server 
     * @returns 
     */
    static createHostFromServer(server: ScenarioServer): RemoteHost {
        // Create the base RemoteHost with a login-enabled shell
        const host = new RemoteHost(server.name, new LoginWrapperShell(new BashShell()));

        // Add login service using accounts from the Server
        const loginService = new CredentialStoreLoginService([{username:'admin',password:'factory-1234'}], host);
        host.registerService('service.loginserver', loginService);
        
        // ... add the user-accounts to the Host
        server.accounts.map( (acc) => { loginService.configureAddUserAccount({username:acc.username, password:acc.password})});

        // Convert server accounts/files into a filesystem
        const fsInit: Record<string, any> = {
            "home": {},
            "bin": {
                "sh": "#!/bin/bash\n# shell implementation would go here",
                "ls": "#!/bin/bash\n# ls implementation would go here"
            }
        };

        // Add user home directories and their files
        server.accounts.forEach((account: ServerAccount) => {
            fsInit.home[account.username] = {
                owner: account.username,
                group: "users",
                content: {}  // Could populate with user-specific files if needed
            };
        });

        // Register the filesystem service
        const fs = new FileSystem(fsInit);
        const fsCreatingUser = anonymousUser;
        host.registerService('service.filesystem', fs );

        // Add all server files at their proper paths
        // For now: choose simple locations. Claude is terrible at understanding how to build the FS despite worked examples
        FSInit_createFolderImpl_IgnorePermissions( fs.resolve(Path.fromString('/')) as FileSystemFolder, 'docs', fsCreatingUser );
        server.files.forEach(file =>
            {
                FSInit_createFileImpl_IgnorePermissions( fs.resolve(Path.fromString('/docs')) as FileSystemFolder, file.name, file.content, fsCreatingUser );
        });

        return host;
    }

    /**
     * Batch converts multiple Servers into RemoteHosts and registers them
     */
    static registerGeneratedServers(servers: ScenarioServer[]): RemoteHost[] {
        const hosts = servers.map(server => this.createHostFromServer(server));
        
        // Register all hosts with the HostResolver
        const resolver = HostResolver.getInstance();
        hosts.forEach(host => resolver.addHost(host));

        return hosts;
    }
}
import { BashShell } from './BashShell';
import { RemoteHost, RemoteSession } from './HostConnection';
import { CredentialStoreLoginService, NameEqualsPasswordLoginService, ServerLoginService } from '../backgroundservices/serverservices/service-login';
import { FileSystem } from '../filesystem';

import { EchoingShell, LoginWrapperShell, SimpleLoginShell, TrivialShell } from './shells';
import { SystemLogService } from '../backgroundservices/serverservices/service-syslog';

/** So that react components can see/react to RemoteHost's being created AND being configured */
import { SubscribableEvent } from '../backgroundservices/subscribable-event';
import { FileContentsGenerator } from '../servergensystem/FileContentsGenerator';
import { AccessLogsFileModule } from '../servergensystem/FileModules/AccessLogsFileModule';
import { AppCredentialsFileModule } from '../servergensystem/FileModules/AppCredentialsFileModule';
import { AuditReportFileModule } from '../servergensystem/FileModules/AuditReportFileModule';
import { ServerConfigGenerator } from '../servergensystem/ServerConfigGenerator';
import { FirstInitialLastNameUsernameGenerator } from '../servergensystem/UsernameGenerator';

/**
 * This is where the virtual-servers in the game get created at startup, and get
 * configured with their hostname, installed shell, running services, etc.
 */
export class HostResolver {
    hosts: RemoteHost[];
    private taggedHosts: Map<string,RemoteHost>;

    private static instance: HostResolver | null = null;
  static getInstance(): HostResolver {
    if (!this.instance) {
      this.instance = new HostResolver();
    }
    return this.instance;
  }

  public readonly onHostAdded: SubscribableEvent<[RemoteHost]> = new SubscribableEvent('hostAdded');
  public readonly onHostRemoved: SubscribableEvent<[RemoteHost]> = new SubscribableEvent('hostRemoved');

  generateFQDN_Home(): string {
    const futuristicTLDs = [
        "home",
    "dial",
    "modem",
    "dsl",
    "cable",
    "net",
    "line",
    "web",
    "local",
    "isp"
    ];
    const tlds = futuristicTLDs;//["com", "net", "org", "io", "dev"];
    const adjectives = ["lazy",
    "happy",
    "blue",
    "fast",
    "slow",
    "sleepy",
    "noisy",
    "tiny",
    "quiet",
    "dusty"];
    const nouns = ["modem",
    "router",
    "user",
    "line",
    "fox",
    "cat",
    "dog",
    "pc",
    "bird",
    "mouse"];

    let fqdn: string;
    do {
        const randomAdjective = adjectives[Math.floor(Math.random() * adjectives.length)];
        const randomNoun = nouns[Math.floor(Math.random() * nouns.length)];
        const randomTLD = tlds[Math.floor(Math.random() * tlds.length)];
        fqdn = `${randomAdjective}.${Math.floor(Math.random()*1000)}-${randomNoun}.${randomTLD}`;
    } while (
        this.hosts.some(host => host.fqdn === fqdn) || fqdn.length > 20
    );

    return fqdn;
}

generateFQDN_Commercial(): string {
    const futuristicTLDs = [
        "ai",
        "cyb",
        "quant",
        "meta",
        "nxt",
        "neon",
        "vr",
        "xrs",
        "syn",
        "bio",
        "alpha",
        "omega",
        "nova",
        "astro",
        "terra",
        "gen",
        "flux",
        "warp",
        "ion",
        "core"
    ];
    const tlds = futuristicTLDs;//["com", "net", "org", "io", "dev"];
    const adjectives = [ 'production', 'prod', "prod-", 'prod-', 'dev-', 'dev', 'staging', "fast", "quick", "tiny", "big", "bright"];
    const nouns = ['cloud', 'cloud-', 'cloud-', 'cdn-', 'instance', 'internal', "fox", "cat", "dog", "bird", "mouse"];
    /** NOTE: these have IMPACT on the game-logic! */
    const serverHostnames = ['web', 'www', 'db', 'sql', 'database', 'mongo', 'app', 'files', 'mail', 'dev', 'prod', 'mx', 'mx','db','database', 'db', 'sql'];
  
    let hostname: string;
    do {
        const randomHostname = serverHostnames[Math.floor(Math.random() * serverHostnames.length)];
        const randomAdjective = adjectives[Math.floor(Math.random() * adjectives.length)];
        const randomNoun = nouns[Math.floor(Math.random() * nouns.length)];
        const randomTLD = tlds[Math.floor(Math.random() * tlds.length)];
        hostname = `${randomHostname}.${randomAdjective}${randomNoun}.${randomTLD}`;
    } while (
        this.hosts.some(host => host.fqdn === hostname) || hostname.length > 20
    );

    return hostname;
}

randomlyGenerateSomeServers()
{
    console.log("rand gen some servers... should only happen once");
    const newHost = this.generateOneServerWithFileSystem();
    this.addHost( newHost );
}

generateOneServerWithFileSystem() : RemoteHost
{
    
    const newHost = new RemoteHost('vitalsync.com', new LoginWrapperShell( new BashShell() ) );
    newHost.registerService( 'service.loginserver', new NameEqualsPasswordLoginService( newHost) );
    newHost.registerService( 'service.filesystem', new FileSystem( {
            "bin": {
                "sh": "#!/bin/bash\n# shell implementation would go here",
                "ls": "#!/bin/bash\n# ls implementation would go here"
            },
            "home": {
                "alice": 
                {
                    content: {
                        "misc.txt": "TODO: nothing"
                    },
                    owner: "alice",
                    group: "users"
                }
            },
            'HR':
            {
                'example-sickness.txt' : 'Current Diagnosis: Influenza'
            },
            'records': {
                'patients':
                {
                        'AArcher': 
                        {
                            content: 'noting',
                            owner: 'alice',
                            group: 'users'
                        },
                        'BButcher': 
                        {
                            content: 'noting',
                            owner: 'alice',
                            group: 'users'
                        },
                        'CCaterham': 
                        {
                            content: 'noting',
                            owner: 'alice',
                            group: 'users'
                        }                            
                }
            },
            "root": {} // empty folder
         } ) );
    return newHost;
}

  constructor()
    {
        this.hosts = [];
        this.taggedHosts = new Map();

        this.addHost( new RemoteHost('localhost', new EchoingShell()) );
        this.addHost( new RemoteHost('a.com', new EchoingShell()) );
        this.addHost( new RemoteHost('b.com', new SimpleLoginShell()) );

        // simplest example of a server with login
        const rh_c_dot_com = new RemoteHost('c.com', new LoginWrapperShell( new EchoingShell()) );
        rh_c_dot_com.registerService( 'service.loginserver', new NameEqualsPasswordLoginService( rh_c_dot_com ) );
        this.addHost( rh_c_dot_com );

            // Add the home router host with syslog service -- for mission1: reboot router
    const routerHost = new RemoteHost('homerouter.local', new LoginWrapperShell(new BashShell( ['reboot'] )));
    routerHost.registerService('service.syslog', new SystemLogService());
    /** Create a login service with custom username and password */
    routerHost.registerService( 'service.loginserver', new CredentialStoreLoginService([{username:'admin',password:'securewifi2024'}], routerHost) );
    this.addHost(routerHost);

    
    // Add the Uncle's home router host with syslog service -- for mission2: change admin password
    const routerHost2 = new RemoteHost('192.168.34.58', new LoginWrapperShell(new BashShell( ['reboot', 'passwd'] )));
    routerHost2.registerService('service.syslog', new SystemLogService());
    /** Create a login service with custom username and password */
    routerHost2.registerService( 'service.loginserver', new CredentialStoreLoginService([{username:'admin',password:'factory-1234'}], routerHost2) );
    this.addHost(routerHost2);
    
            /** A more complex, realistic, example of a host/server */
            const rh_vitalSync = new RemoteHost('vitalsync.com', new LoginWrapperShell( new BashShell() ) );
            rh_vitalSync.registerService( 'service.loginserver', new NameEqualsPasswordLoginService( rh_vitalSync) );
            rh_vitalSync.registerService( 'service.filesystem', new FileSystem( {
                    "bin": {
                        "sh": "#!/bin/bash\n# shell implementation would go here",
                        "ls": "#!/bin/bash\n# ls implementation would go here"
                    },
                    "home": {
                        "alice": 
                        {
                            content: {
                                "misc.txt": "TODO: nothing"
                            },
                            owner: "alice",
                            group: "users"
                        }
                    },
                    'HR':
                    {
                        'example-sickness.txt' : 'Current Diagnosis: Influenza'
                    },
                    'records': {
                        'patients':
                        {
                                'AArcher': 
                                {
                                    content: 'noting',
                                    owner: 'alice',
                                    group: 'users'
                                },
                                'BButcher': 
                                {
                                    content: 'noting',
                                    owner: 'alice',
                                    group: 'users'
                                },
                                'CCaterham': 
                                {
                                    content: 'noting',
                                    owner: 'alice',
                                    group: 'users'
                                }                            
                        }
                    },
                    "root": {} // empty folder
                 } ) );
            this.addHost( rh_vitalSync );

            this.randomlyGenerateSomeServers();
    }

    addHost(host: RemoteHost, tag?:string): void {
        this.hosts.push(host);
        if( tag )
        {
            if( this.taggedHosts[tag])
                console.error(`Cannot add host with tag (${tag}), already have a host with that tag: ${this.taggedHosts.get(tag)}`);
            
            this.taggedHosts.set(tag,host);
        }
        this.onHostAdded.invoke(host); // Notify subscribers
      }
    
      removeHost(host: RemoteHost): void {
        this.hosts = this.hosts.filter(h => h !== host);
        this.onHostRemoved.invoke(host); // Notify subscribers
      }

      getTaggedHost( tag: string )
      {
        if( this.taggedHosts[tag])
            return this.taggedHosts[tag];
        
        console.error("No host with tag: "+tag);
        return null;
      }
      
      /**
       * Allows missions to re-use a live server if it already exists (with whatever it has),
       * or create an initial instance if that server didn't already exist.
       * 
       * In particular: enables missions to randomize some elements of the server on each
       * new game, but share the 'this game's version' of those elements with the other missions
       * during the same game-run.
       * 
       * There are many flaws with this approach, but ... it's simple. It will probably come back
       * to bite me for being too error-prone.
       * 
       * @param tag 
       * @param hostCreator 
       * @returns 
       */
      fetchOrCreateTaggedHost( tag: string, hostCreator: ((resolver:HostResolver)=>RemoteHost) )
      {
        if( this.taggedHosts.get(tag))
        {
            console.log("returning FOUND tagged host for tag = "+tag+", host = "+this.taggedHosts.get(tag));
            return this.taggedHosts.get(tag);
        }
        else
        {
            console.log("No host found for tag = "+tag+", will run hostcreator = "+hostCreator );
            const newHost = hostCreator(this);

            if( !newHost )
            {
                console.error("hostCreator(this) failed")
                throw new Error("hostCreator(..) didn't return a host")
            }
                

            // check the caller didn't just try to create a host with clash on hostname/IP
            const oldHost = this.resolve(newHost.fqdn);
            if( oldHost )
            {
                console.error(`Something just tried to create a new host with new tag '${tag}' - tag did not exist, but the HOSTNAME it tried to create already existed: '${oldHost.fqdn}'`);
                throw new Error(`Illegal duplicate hostname attempted for a new host: ${oldHost.fqdn}`);
            }

            // proceed...
            this.addHost( newHost, tag );

            console.log(`returning fqdn: ${newHost.fqdn}, new host: ${newHost}`);
            return newHost;
        }
      }

      chooseRandomUnusedHostname()
      {

      }
    
      getAllHosts(): RemoteHost[] {
        return this.hosts;
      }

    resolve(host): RemoteHost {
        //console.log(`Resolving host: ${host}`);
        return this.hosts.find((match) => match.fqdn === host) as RemoteHost;
    }
}
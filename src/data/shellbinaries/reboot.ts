import { FileSystem, Node, Folder } from '../../filesystem';
import { Path } from '../../filesystem/path/path';
import { RemoteSession } from '../HostConnection';
import { LoggedInUser } from '../../data/HostConnection';
import { anonymousUser } from '../../filesystem/filesystem';
import { formatPermissions } from '../../filesystem/types/permissions';
import { DefaultBinaryExecutor } from './DefaultBinaryExecutor';
import { SystemLogService } from '../../backgroundservices/serverservices/service-syslog';

export class reboot extends DefaultBinaryExecutor {
    async execute(args: string[], session: RemoteSession): Promise<void>
    {
        session.sendOutput("Rebooting...");
        const syslog = session.host.service(SystemLogService);
        if( syslog )
        {
            syslog.logEvent('reboot', `User issued reboot: '${session.user?.id ?? 'unknown'}'`);
            await new Promise(resolve => setTimeout(resolve, 1500));
            session.sendOutput("Disconnecting all terminals...");
            await new Promise(resolve => setTimeout(resolve, 1000));
            session.disconnectClient();
        }
        else
        {
        session.sendOutput("...reboot failed, missing syslogd");
        console.error("Can't exec a 'reboot' when there's no SystemLogService -- nothing will happen!");
        }
    }
}
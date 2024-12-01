import { FileSystem, Node, Folder } from '../../filesystem';
import { Path } from '../../filesystem/path/path';
import { RemoteSession } from '../HostConnection';
import { LoggedInUser } from '../../data/HostConnection';
import { anonymousUser } from '../../filesystem/filesystem';
import { formatPermissions } from '../../filesystem/types/permissions';
import { DefaultBinaryExecutor } from './DefaultBinaryExecutor';

export class whoami extends DefaultBinaryExecutor {
    execute(args: string[], session: RemoteSession): void {
{
    if( session.user )
        session.sendOutput( session.user?.id );
}
    }
}
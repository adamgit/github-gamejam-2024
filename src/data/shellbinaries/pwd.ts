import { FileSystem, Node, Folder } from '../../filesystem';
import { Path } from '../../filesystem/path/path';
import { RemoteSession } from '../HostConnection';
import { anonymousUser } from '../../filesystem/filesystem';
import { DefaultBinaryExecutor } from './DefaultBinaryExecutor';

export class pwd extends DefaultBinaryExecutor {
    execute(args: string[], session: RemoteSession): void {
  const fs = session.host.service(FileSystem);

   if( ! fs )
   {
    session.sendOutput("Error: missing filesystem, binary cannot function");
   }
   else
   {
   const pwd = session.environmentVariables['PWD'];
   const effectiveUser = session.user ?? anonymousUser;

   if( pwd )
   {
    const targetPath = Path.fromString(pwd); 

    session.sendOutput( targetPath.toString() );
   }
  }
}
}
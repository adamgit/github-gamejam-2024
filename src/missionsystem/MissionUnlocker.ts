export class MissionUnlocker
{
    private unlockedKeys = new Set<string>();

    public unlock( keys: string[]) : void
    {
        keys?.forEach( key => this.unlockedKeys.add(key));
    }

    public lock( keys: string[]) : void
    {
        console.log("LOCKING (i.e. removing 'unlockedKeys'): "+JSON.stringify(keys));
        keys?.forEach( key => this.unlockedKeys.delete(key));
        console.log("...post:LOCKING (i.e. removing 'unlockedKeys'): "+JSON.stringify(keys));
    }

    public areAllKeysUnlocked( keys:string[]): boolean
    {
        return keys?.every( (key) => this.unlockedKeys.has(key)) ?? true;
    }

    public areAnyKeysLocked( keys:string[]): boolean
    {
        return keys?.some( (key) => this.unlockedKeys.has(key)) ?? false;
    }

    public getUnlockedKeys():string[]
    {
        return Array.from(this.unlockedKeys);
    }
}
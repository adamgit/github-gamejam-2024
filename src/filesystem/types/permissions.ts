export type PermissionScope = "owner" | "group" | "everyone" | Set<string>;

export interface FilePermissions {
    readonly owner: string;
    readonly group: string;
    readonly readableBy: PermissionScope;
    readonly writableBy: PermissionScope;
    readonly executableBy: PermissionScope;
}

function getPermissionChar(
    scope: PermissionScope,
    currentScope: "owner" | "group" | "everyone",
    userId: string,
    groupId: string
): string {
    if (scope === "everyone") return "1";
    if (scope === "owner" && currentScope === "owner") return "1";
    if (scope === "group" && currentScope === "group") return "1";
    if (scope instanceof Set) {
        if (currentScope === "owner" && scope.has(userId)) return "1";
        if (currentScope === "group" && scope.has(groupId)) return "1";
    }
    return "-";
}

// Convert permissions object to Unix-style string (e.g., "rwxr-xr-x")
export function formatPermissions(permissions: FilePermissions): string {
    const scopes: Array<"owner" | "group" | "everyone"> = ["owner", "group", "everyone"];
    let result = "";
    
    for (const scope of scopes) {
        result += getPermissionChar(permissions.readableBy, scope, permissions.owner, permissions.group) === "1" ? "r" : "-";
        result += getPermissionChar(permissions.writableBy, scope, permissions.owner, permissions.group) === "1" ? "w" : "-";
        result += getPermissionChar(permissions.executableBy, scope, permissions.owner, permissions.group) === "1" ? "x" : "-";
    }
    
    return result;
}
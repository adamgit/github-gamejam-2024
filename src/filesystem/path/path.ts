export class Path {
    private readonly _segments: ReadonlyArray<string>;
    private readonly _isAbsolute: boolean;
    private readonly _upCount: number;  // Number of unresolved "../" at start of relative path

    private constructor(segments: string[], isAbsolute: boolean, upCount: number = 0) {
        this._segments = Object.freeze(segments);
        this._isAbsolute = isAbsolute;
        this._upCount = upCount;
    }

    get segments(): ReadonlyArray<string> {
        return this._segments;
    }

    get isAbsolute(): boolean {
        return this._isAbsolute;
    }

    get upCount(): number {
        return this._upCount;
    }

    get parent(): Path {
        if (this._segments.length === 0) {
            // For absolute paths, parent of root is root
            if (this._isAbsolute) {
                return this;
            }
            // For relative paths, add another level of "../"
            return new Path([], false, this._upCount + 1);
        }
        return new Path(this._segments.slice(0, -1), this._isAbsolute, this._upCount);
    }

    get name(): string {
        return this._segments[this._segments.length - 1] || '';
    }

    get isRoot(): boolean {
        return this._isAbsolute && this._segments.length === 0;
    }

    append(other: Path | string): Path {
        const otherPath = other instanceof Path ? other : Path.fromString(other);
        
        // If other path is absolute, return it directly
        if (otherPath.isAbsolute) {
            return otherPath;
        }

        // If this path is absolute, resolve the "../" against our segments
        if (this._isAbsolute) {
            const resultSegments = [...this._segments];
            
            // Handle "../" in other path
            for (let i = 0; i < otherPath._upCount; i++) {
                if (resultSegments.length > 0) {
                    resultSegments.pop();
                }
            }
            
            // Add remaining segments
            return new Path([...resultSegments, ...otherPath._segments], true);
        }

        // Both paths are relative, combine their "../" counts and segments
        return new Path(
            [...otherPath._segments],
            false,
            this._upCount + otherPath._upCount
        );
    }

    equals(other: Path): boolean {
        return this.toString() === other.toString();
    }

    startsWith(other: Path): boolean {
        if (this._isAbsolute !== other._isAbsolute) {
            return false;
        }
        if (this._upCount !== other._upCount) {
            return false;
        }
        if (other._segments.length > this._segments.length) {
            return false;
        }
        return other._segments.every((segment, i) => segment === this._segments[i]);
    }

    toString(): string {
        const prefix = this._isAbsolute ? '/' : '../'.repeat(this._upCount);
        return prefix + this._segments.join('/');
    }

    static fromString(path: string): Path {
        const isAbsolute = path.startsWith('/');
        
        // Split path and remove empty segments
        const rawSegments = path.split('/').filter(segment => segment.length > 0);
        
        if (isAbsolute) {
            // For absolute paths, resolve "." and ".." immediately
            const resolvedSegments: string[] = [];
            for (const segment of rawSegments) {
                if (segment === '.') {
                    continue;
                } else if (segment === '..') {
                    if (resolvedSegments.length > 0) {
                        resolvedSegments.pop();
                    }
                } else {
                    resolvedSegments.push(segment);
                }
            }
            return new Path(resolvedSegments, true);
        } else {
            // For relative paths, count leading "../" segments
            let upCount = 0;
            let segmentIndex = 0;
            
            // Count initial "../" sequences
            while (segmentIndex < rawSegments.length) {
                const segment = rawSegments[segmentIndex];
                if (segment === '..') {
                    upCount++;
                    segmentIndex++;
                } else if (segment === '.') {
                    segmentIndex++;
                } else {
                    break;
                }
            }
            
            // Get remaining path segments, filtering out "."
            const segments = rawSegments
                .slice(segmentIndex)
                .filter(segment => segment !== '.' && segment !== '..');
                
            return new Path(segments, false, upCount);
        }
    }

    static root(): Path {
        return new Path([], true);
    }
}
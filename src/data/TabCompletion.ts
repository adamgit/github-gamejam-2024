import { RemoteHost, RemoteSession } from "./HostConnection"

export interface CompletionContext {
    bufferToComplete: string,
    bufferSuffix: string,
    words: string[],
    lastWord: string,
    isFirstWord: boolean
}

export interface CompletionResult {
    value: string;
    chainable: boolean;
}

export class TabCompleter {
    constructor(private getBinaryCompletions: (binaryName: string, precedingArgs: string[], partialArg: string, session: RemoteSession) => CompletionResult[]) {}

    extractCompletionContext(inputBuffer: string, cursorPosition: number): CompletionContext {
        const bufferToComplete = inputBuffer.slice(0, cursorPosition);
        const bufferSuffix = inputBuffer.slice(cursorPosition);

        const adjustedBuffer = this.adjustBufferForPartialWord(bufferToComplete, bufferSuffix);
        
        const words = adjustedBuffer.split(' ');
        return {
            bufferToComplete: adjustedBuffer,
            bufferSuffix,
            words,
            lastWord: words[words.length - 1],
            isFirstWord: words.length === 1
        };
    }

    private adjustBufferForPartialWord(bufferToComplete: string, bufferSuffix: string): string {
        if (bufferSuffix.length > 0 && bufferSuffix.charAt(0) != ' ') {
            while (bufferSuffix.length > 0 && bufferSuffix[0] !== ' ') {
                bufferToComplete += bufferSuffix[0];
                bufferSuffix = bufferSuffix.slice(1);
            }
        }
        return bufferToComplete;
    }

    getCompletionMatches(context: CompletionContext, availableCommands: string[], session: RemoteSession): CompletionResult[] {
        if (context.isFirstWord) {

            return availableCommands
                .filter(cmd => cmd.startsWith(context.lastWord))
                .map(cmd => ({ value: cmd, chainable: false }));
        }

        const completions = this.getBinaryCompletions(
                        context.words[0], 
                        context.words.slice(1, -1),
                        context.lastWord,
                        session
                    );
        return completions.filter(c => c.value.startsWith(context.lastWord));
    }

    applyCompletion(matches: CompletionResult[], context: CompletionContext, isSecondTab: boolean, session: RemoteSession): void {
        if (matches.length === 1) {
            const match = matches[0];
            context.words[context.words.length - 1] = match.value;
            const suffix = match.chainable ? '' : ' ';
            session.setInputBuffer(context.words.join(' ') + suffix + context.bufferSuffix);
        } else if (matches.length > 1) {
            if (isSecondTab) {
                session.sendOutput('\n' + matches.map(m => m.value).join('  '));
            } else {
                const commonPrefix = this.findCommonPrefix(matches.map(m => m.value));
                if (commonPrefix.length > context.lastWord.length) {
                    context.words[context.words.length - 1] = commonPrefix;
                    session.setInputBuffer(context.words.join(' ') + context.bufferSuffix);
                }
            }
        }
    }

    private findCommonPrefix(strings: string[]): string {
        if (strings.length === 0) return '';
        let prefix = strings[0];
        for (let i = 1; i < strings.length; i++) {
            while (!strings[i].startsWith(prefix)) {
                prefix = prefix.slice(0, -1);
            }
        }
        return prefix;
    }
}
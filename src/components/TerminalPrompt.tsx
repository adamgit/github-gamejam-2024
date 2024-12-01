import React, { useContext, useEffect, useRef, useState } from 'react';
import { RemoteHost, RemoteSession } from '../data/HostConnection';

interface PromptProps {
    session: RemoteSession | undefined;
    className?: string;
    environmentVersion: number;  // Forces re-render when environment changes
  }

  const TerminalPrompt = ({ session, className, environmentVersion }: PromptProps) => {
    // environmentVersion is unused but forces re-render when changed
    
    if (!session) {
      return <span className={className}>[Disconnected] $</span>;
    }
  
    const promptOverride = session.environmentVariables["PROMPT_OVERRIDE"];
    if (promptOverride !== undefined) {
      return <span className={className}>{promptOverride}</span>;
    }
  
    const username = session.environmentVariables["username"];
    const isInHomeFolder = (session.environmentVariables['HOME']?.length > 0) && (session.environmentVariables['HOME'] === session.environmentVariables['PWD']);
    
    if (!username) {
      return <span className={className}>{session.host.fqdn}:$</span>;
    }
  
    return <span className={className}>{`${username}@${session.host.fqdn}:${ isInHomeFolder ? '~':''}$`}</span>;
  };

export default TerminalPrompt;
import React, { useState, useEffect, useRef, useContext } from 'react';
import { Avatar, Badge, Typography, TextField, Button, IconButton } from '@mui/material';
import { WhassupMessageCounter } from './WhassupMessageCounter';

interface ContactsListProps {
    contacts: Array<any>;  // Type properly based on your contacts structure
    selectedUserId: string | null;
    messageCounter: WhassupMessageCounter;
    onContactSelect: (userId: string) => void;
    isMinimized?: boolean;
  }
  
  const ContactsList = ({
    contacts,
    selectedUserId,
    messageCounter,
    onContactSelect,
    isMinimized
  }: ContactsListProps) => {
    return (
      <div className={`user-list ${isMinimized ? 'minimized' : ''}`}>
        {contacts.map(user => (
          <div key={user.id} className="user-avatar" onClick={() => onContactSelect(user.id)}>
            <Badge
              color="error"
              badgeContent={messageCounter.getUnreadForUser(user.id)}
              invisible={!messageCounter.getUnreadForUser(user.id)}
              sx={{ '& .MuiBadge-badge': { backgroundColor: 'red' } }}
            >
              <Avatar
                src={user.avatar}
                alt={user.fullname()}
                sx={{
                  filter: user.online ? 'none' : 'grayscale(100%)',
                  border: selectedUserId === user.id ? '2px solid blue' : 'none',
                  boxShadow: selectedUserId === user.id ? '0px 0px 10px rgba(0, 0, 255, 0.5)' : 'none',
                  transition: 'all 0.3s ease',
                }}
              />
            </Badge>
            {!isMinimized && <Typography>{user.firstname}</Typography>}
          </div>
        ))}
      </div>
    );
  };

  export default ContactsList;
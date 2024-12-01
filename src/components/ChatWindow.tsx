import React, { useState, useEffect, useRef, useContext } from 'react';
import { Avatar, Badge, Typography, TextField, Button, IconButton } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { ChatService, Message } from '../backgroundservices/desktopservices/service-whassup';

interface ChatWindowProps {
    selectedUser: any;  // Type properly based on your user structure
    messages: Array<Message>;
    onBack: () => void;
    onSendMessage: (message: string) => void;
    chatService: ChatService;
  }
  
  const ChatWindow = ({
    selectedUser,
    messages,
    onBack,
    onSendMessage,
    chatService
  }: ChatWindowProps) => {
    const [newMessage, setNewMessage] = useState('');
    const scrollRef = useRef<HTMLDivElement>(null);
  
    useEffect(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }
    }, [messages, selectedUser.id]);
  
    const handleSend = () => {
      if (newMessage.trim()) {
        onSendMessage(newMessage);
        setNewMessage('');
      }
    };
  
    return (
      <div className="chat-window">
        <div className="chat-header">
          <IconButton onClick={onBack}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h6">
            {chatService.infoForUser(selectedUser.id)?.fullname() ?? 'UNKNOWN'}
          </Typography>
        </div>
        <div className="chat-content" ref={scrollRef}>
          {messages?.map((msg, index) => (
            <div
              key={index}
              className={`chat-message ${msg.sender === 'self' ? 'from-user' : 'from-other'}`}
            >
              <Typography>{msg.content}</Typography>
            </div>
          ))}
        </div>
        <div className="chat-input">
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Type a message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleSend();
              }
            }}
          />
          <Button variant="contained" color="primary" onClick={handleSend}>
            Send
          </Button>
        </div>
      </div>
    );
  };

  export default ChatWindow;
import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { chatService } from '../services/api';
import { socketService } from '../services/socket';
import { useAuth } from '../context/AuthContext';
import {
  FiSend,
  FiPaperclip,
  FiArrowLeft,
  FiMoreVertical,
  FiUser,
  FiCheck,
  FiCheckCircle,
  FiClock,
  FiImage
} from 'react-icons/fi';
import toast from 'react-hot-toast';

const ChatPage = () => {
  const { chatId } = useParams();
  const { user } = useAuth();
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const [chats, setChats] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [typing, setTyping] = useState(false);
  const [typingUser, setTypingUser] = useState(null);

  // Fetch all user chats
  useEffect(() => {
    fetchChats();
  }, []);

  // Handle specific chat from URL
  useEffect(() => {
    if (chatId && chats.length > 0) {
      const chat = chats.find(c => (c.id || c._id) === chatId);
      if (chat) {
        setActiveChat(chat);
        fetchMessages(chatId);
      }
    }
  }, [chatId, chats]);

  // Socket connection
  useEffect(() => {
    socketService.connect();

    socketService.onMessage((message) => {
      if ((message.chat === activeChat?.id || message.chat === activeChat?._id)) {
        setMessages(prev => [...prev, message]);
        scrollToBottom();
      }
    });

    socketService.onTyping((data) => {
      if (data.chatId === (activeChat?.id || activeChat?._id) && data.userId !== (user?.id || user?._id)) {
        setTypingUser(data.userName);
        setTyping(true);
      }
    });

    socketService.onStopTyping((data) => {
      if (data.chatId === (activeChat?.id || activeChat?._id)) {
        setTyping(false);
        setTypingUser(null);
      }
    });

    return () => {
      socketService.disconnect();
    };
  }, [activeChat?.id, activeChat?._id, user?.id, user?._id]);

  // Join chat room when active chat changes
  useEffect(() => {
    if (activeChat) {
      socketService.joinChat(activeChat.id || activeChat._id);
    }
  }, [activeChat?.id, activeChat?._id]);

  // Scroll to bottom on new messages
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchChats = async () => {
    setLoading(true);
    try {
      const response = await chatService.getUserChats();
      const resData = response.data?.data?.chats || response.data?.data || response.data || [];
      setChats(Array.isArray(resData) ? resData : []);
    } catch (error) {
      console.error('Error fetching chats:', error);
      toast.error('Failed to load chats');
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (id) => {
    try {
      const response = await chatService.getChatMessages(id);
      const resData = response.data?.data?.messages || response.data?.data || response.data || [];
      setMessages(Array.isArray(resData) ? resData : []);
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast.error('Failed to load messages');
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeChat) return;

    setSending(true);
    try {
      const messageData = {
        content: newMessage.trim(),
        chatId: activeChat.id || activeChat._id
      };

      socketService.sendMessage(messageData);
      setNewMessage('');
      inputRef.current?.focus();
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const handleTyping = () => {
    if (activeChat) {
      socketService.emitTyping(activeChat.id || activeChat._id);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short'
      });
    }
  };

  const getOtherUser = (chat) => {
    return chat.participants?.find(p => (p.id || p._id) !== (user?.id || user?._id)) || {};
  };

  const groupMessagesByDate = (messages) => {
    const groups = {};
    messages.forEach(msg => {
      const date = new Date(msg.created_at || msg.createdAt).toDateString();
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(msg);
    });
    return groups;
  };

  return (
    <div className="h-[calc(100vh-120px)] flex">
      {/* Chat List Sidebar */}
      <div className={`w-full md:w-80 flex-shrink-0 border-r dark:border-gray-700 ${activeChat ? 'hidden md:block' : ''}`}>
        <div className="h-full flex flex-col">
          <div className="p-4 border-b dark:border-gray-700">
            <h2 className="text-xl font-bold">Messages</h2>
          </div>

          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="p-4 space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex gap-3 animate-pulse">
                    <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-2"></div>
                      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : chats.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <p>No conversations yet</p>
                <Link to="/items" className="text-primary-600 hover:underline mt-2 block">
                  Browse items to start chatting
                </Link>
              </div>
            ) : (
              <div>
                {chats.map(chat => {
                  const otherUser = getOtherUser(chat);
                  const isActive = (activeChat?.id || activeChat?._id) === (chat.id || chat._id);

                  return (
                    <button
                      key={chat.id || chat._id}
                      onClick={() => {
                        setActiveChat(chat);
                        fetchMessages(chat.id || chat._id);
                      }}
                      className={`w-full p-4 flex items-start gap-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${
                        isActive ? 'bg-primary-50 dark:bg-primary-900/20' : ''
                      }`}
                    >
                      <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
                        <FiUser className="text-primary-600" />
                      </div>
                      <div className="flex-1 text-left min-w-0">
                        <div className="flex justify-between items-center">
                          <h3 className="font-medium truncate">{otherUser.name}</h3>
                          {chat.lastMessage && (
                            <span className="text-xs text-gray-500">
                              {formatTime(chat.lastMessage.created_at || chat.lastMessage.createdAt)}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-500 truncate">
                          {chat.lastMessage?.content || 'No messages yet'}
                        </p>
                        {chat.item && (
                          <span className="text-xs text-primary-600">
                            Re: {chat.item.title}
                          </span>
                        )}
                      </div>
                      {chat.unreadCount > 0 && (
                        <span className="bg-primary-600 text-white text-xs px-2 py-1 rounded-full">
                          {chat.unreadCount}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Chat Area */}
      <div className={`flex-1 flex flex-col ${!activeChat ? 'hidden md:flex' : ''}`}>
        {!activeChat ? (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <FiImage className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg">Select a conversation to start messaging</p>
            </div>
          </div>
        ) : (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b dark:border-gray-700 flex items-center justify-between bg-white dark:bg-gray-800">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setActiveChat(null)}
                  className="md:hidden p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                >
                  <FiArrowLeft />
                </button>
                <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                  <FiUser className="text-primary-600" />
                </div>
                <div>
                  <h3 className="font-medium">{getOtherUser(activeChat).name}</h3>
                  {typing && (
                    <p className="text-xs text-primary-600">typing...</p>
                  )}
                </div>
              </div>

              {activeChat.item && (
                <Link
                  to={`/items/${activeChat.item?.id || activeChat.item?._id}`}
                  className="text-sm text-primary-600 hover:underline flex items-center"
                >
                  View Item
                </Link>
              )}
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-gray-50 dark:bg-gray-900">
              {Object.entries(groupMessagesByDate(messages)).map(([date, msgs]) => (
                <div key={date}>
                  <div className="flex items-center justify-center mb-4">
                    <span className="bg-gray-200 dark:bg-gray-700 px-3 py-1 rounded-full text-xs text-gray-600 dark:text-gray-400">
                      {formatDate(msgs[0].created_at || msgs[0].createdAt)}
                    </span>
                  </div>

                  <AnimatePresence>
                    {msgs.map((message, index) => {
                      const isOwn = (message.sender?.id || message.sender?._id) === (user?.id || user?._id) || message.sender === (user?.id || user?._id);

                      return (
                        <motion.div
                          key={message.id || message._id || index}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-2`}
                        >
                          <div
                            className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                              isOwn
                                ? 'bg-primary-600 text-white rounded-br-none'
                                : 'bg-white dark:bg-gray-800 rounded-bl-none shadow'
                            }`}
                          >
                            <p className="break-words">{message.content}</p>
                            <div className={`flex items-center justify-end gap-1 mt-1 ${
                              isOwn ? 'text-primary-200' : 'text-gray-400'
                            }`}>
                              <span className="text-xs">
                                {formatTime(message.created_at || message.createdAt)}
                              </span>
                              {isOwn && (
                                message.read ? (
                                  <FiCheckCircle className="w-3 h-3" />
                                ) : (
                                  <FiCheck className="w-3 h-3" />
                                )
                              )}
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
              ))}

              {typing && (
                <div className="flex justify-start">
                  <div className="bg-white dark:bg-gray-800 rounded-2xl rounded-bl-none px-4 py-3 shadow">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></span>
                      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></span>
                      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <form onSubmit={handleSendMessage} className="p-4 border-t dark:border-gray-700 bg-white dark:bg-gray-800">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                >
                  <FiPaperclip className="w-5 h-5" />
                </button>

                <input
                  ref={inputRef}
                  type="text"
                  value={newMessage}
                  onChange={(e) => {
                    setNewMessage(e.target.value);
                    handleTyping();
                  }}
                  placeholder="Type a message..."
                  className="flex-1 bg-gray-100 dark:bg-gray-700 rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />

                <button
                  type="submit"
                  disabled={!newMessage.trim() || sending}
                  className="p-2 bg-primary-600 text-white rounded-full hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {sending ? (
                    <span className="spinner w-5 h-5"></span>
                  ) : (
                    <FiSend className="w-5 h-5" />
                  )}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export default ChatPage;

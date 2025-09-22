'use client'
import React, { useEffect, useState, useCallback, useContext } from "react";
import { io, Socket } from "socket.io-client";

interface SocketContextI {
    sendMessage: (msg: string) => any;
    messages: string[];
}

const SocketContext = React.createContext<SocketContextI | null>(null); // Empty context api propsType (or) null byDefault

export const useSocket = () => {
    const state = useContext(SocketContext);
    if(!state) throw new Error("State Is undefined !");
    return state;
};

interface SocketProviderProps{
    children?: React.ReactNode;
}

// Functional component for context
export const SocketProvider: React.FC<SocketProviderProps> = ({ children }) => {
    const [socket, setSocket] = useState<Socket>();
    const [messages, setMessages] = useState<string[]>([]); // array of message

    // if same msg from server to client multiple times then useCallback to avoid multiple console logs [redundant calls avoidance]
    const onMessageReceived = useCallback((msg: string) => { // The event listens for the messages sent by the server via our socket connection
        const { message } = JSON.parse(msg) as { message: string }; // msg is string so parse it to json
        setMessages(prev => [...prev, message]); // append new msg to prev msgs
        console.log(`New Message Received From Server : ${message}`);
    }, []);

    useEffect(() => {
        const  _socket = io("http://localhost:5000");
        _socket.on('message', onMessageReceived); // Listen to 'message' event from server
        setSocket(_socket);
        return () => {
            _socket.disconnect(); // Cleanup function to disc all prev webs
            _socket.off('message', onMessageReceived); // Remove listener on cleanup [unsubscribe] for this particular event
            setSocket(undefined);
        };
    }, []);

    const sendMessage: SocketContextI['sendMessage'] = useCallback((msg) => {
        console.log(`Send Message : ${msg}`);
        if(socket && msg) socket.emit('event:message', { message: msg });
    }, [socket]);        
    return (
        <SocketContext.Provider value={{ sendMessage, messages }}>
            {children}
        </SocketContext.Provider>
    );
};


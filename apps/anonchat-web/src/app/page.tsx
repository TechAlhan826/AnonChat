'use client'
import Image, { type ImageProps } from "next/image";
//import { Button } from "@repo/ui/button";
import styles from "./page.module.css";
import { useState } from "react";
import { useSocket } from "../context/SocketProvider";

export default function Page(){
  const [message, setMessage] = useState('');
  const { sendMessage, messages } = useSocket();

  return (
    <div className={styles.page}>
      <h1>Live Chat Application</h1>
      <input onChange={e => setMessage(e.target.value)} type="text" name="message" id="message" placeholder="Message"  className={styles.input}/>
      <button className={styles.secondary} onClick={()=> sendMessage(message)}>
          Send
        </button>
      <div className={styles.messages}>
        {messages.map((msg, index) => (
          <div key={index} className={styles.message}>
            {msg}
          </div>
        ))}
      </div>
    </div>
  )
}
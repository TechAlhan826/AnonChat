import { Server } from "socket.io";
import Redis from "ioredis";
import dotenv from "dotenv";

dotenv.config();

const REDIS_URL = process.env.REDIS_SERVICE_URI || "rediss://default:";
//console.log(REDIS_URL);
const pub = new Redis(REDIS_URL); // Redis Publisher
const sub = new Redis(REDIS_URL); // Redis Subscriber

class SocketService {
    private _io: Server;

    constructor() {
        console.log("Socket Server Initialized...");
        this._io = new Server({
            cors: { // Add cors to *Socket.io WS Server
                allowedHeaders: ['*'],
                origin: "*"
            }
         }); 
         sub.subscribe("CHAT_MESSAGES"); // Subscribe to redis channel
    }

    get io(){
        return this._io;
    }

    public initListeners(){
        console.log("Socket Listeners Initialized...");
        const io = this.io;

        io.on("connect", (socket) => {
            console.log(`New Socket Connected : ${socket.id}`);

            socket.on('event:message', async({ message } : { message: string; }) => { // as we publish to redis so why async func
                console.log(`New Message Received : ${message}`); // If any message received publish to redis
                await pub.publish('CHAT_MESSAGES', JSON.stringify({ message })); // -> destruct means msg:msg like that
            });
        });

        sub.on('message', (channel, message) => { // Subscribe to redis channel
            if(channel === "CHAT_MESSAGES"){ // If any message received from redis publish to all socket clients
                this.io.emit('message', message); // 
                console.log(`New Message Published To Clients : ${message}`);
            }
         });
    }
}

export default SocketService;
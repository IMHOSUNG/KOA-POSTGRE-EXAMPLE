//controllers/Auction.ts

import { BaseContext } from 'koa';
import { getManager, Repository, Not, Equal } from 'typeorm';
import { validate, ValidationError } from 'class-validator';
import { Auction } from 'models/aution';

const clients:any = new Set<any>();

function sendText() {
    let msg = {
        type : "message",
        text : "get text",
        id : "client_id",
        data : Date.now()
    }
    return msg;
}
export default class WsActionController {
    
    public static async accessTest (ctx: BaseContext) {
        clients.add(ctx.websocket);
        ctx.websocket.on('message', (message:string)=>{
            console.log(`receive : ${message}`);

            for(let client of clients){
                client.send(message);
            }
        });
    }
}
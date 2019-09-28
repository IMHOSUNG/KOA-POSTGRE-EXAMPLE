//controllers/Auction.ts

import { BaseContext } from 'koa';
import { getManager, Repository, Not, Equal } from 'typeorm';
import { validate, ValidationError } from 'class-validator';
import { User } from 'models/user';

export default class WsActionController {
    
    public static async accessTest (ctx:any) {

        const userRepository:Repository<User> = getManager().getRepository(User);

        const users:User[] = await userRepository.find();
        ctx.wss.clients
        .forEach((client:any) => {
            client.send(`access using koa ${JSON.stringify(users)}`);
        });

        ctx.wsc.onopen((event:any)=>{
            ctx.wsc.send('data from wss when get post');
        })
    }
}
//controllers/Auction.ts

import { BaseContext } from 'koa';
import { getManager, Repository, Not, Equal } from 'typeorm';
import { validate, ValidationError } from 'class-validator';
import { Auction } from 'models/aution';


export default class WsActionController {

    public static async getAuctions (ctx: BaseContext) {

        ctx.websocket.send("Hello World");
    }
}
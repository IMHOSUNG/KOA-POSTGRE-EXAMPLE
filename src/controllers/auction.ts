//controllers/Auction.ts

import { BaseContext } from 'koa';
import { getManager, Repository, Not, Equal } from 'typeorm';
import { validate, ValidationError } from 'class-validator';
import { Auction } from 'models/aution';


export default class AuctionController {

    public static async getAuctions (ctx: BaseContext) {

        // get a Auction repository to perform operations with Auction
        const AuctionRepository: Repository<Auction> = getManager().getRepository(Auction);

        // load all Auctions
        const Auctions: Auction[] = await AuctionRepository.find();

        // return OK status code and loaded users array
        ctx.status = 200;
        ctx.body = Auctions;
    }

    public static async getAuction (ctx: BaseContext) {

        // get a Auction repository to perform operations with Auction
        const AuctionRepository: Repository<Auction> = getManager().getRepository(Auction);

        // load Auction by id
        const auction: Auction = await AuctionRepository.findOne(ctx.params.id);

        if (auction) {
            // return OK status code and loaded Auction object
            ctx.status = 200;
            ctx.body = Auction;
        } else {
            // return a BAD REQUEST status code and error message
            ctx.status = 400;
            ctx.body = 'The Auction you are trying to retrieve doesn\'t exist in the db';
        }

    }

    public static async createAuction (ctx: BaseContext) {

        // get a Auction repository to perform operations with Auction
        const AuctionRepository: Repository<Auction> = getManager().getRepository(Auction);
        
        // build up entity Auction to be saved
        const AuctionToBeSaved: Auction = new Auction();
  
        AuctionToBeSaved.name = ctx.request.body.name
        AuctionToBeSaved.hashedPassword = ctx.request.body.hashedPassword;

        //validate(ctx.request.body.name);

        // validate Auction entity
        const errors: ValidationError[] = await validate(AuctionToBeSaved, { skipMissingProperties: true }); // errors is an array of validation errors
        if (errors.length > 0) {
            // return BAD REQUEST status code and errors array
            ctx.status = 400;
            ctx.body = errors;
        } else if ( await AuctionRepository.findOne({ name: AuctionToBeSaved.name}) ) {
            // return BAD REQUEST status code and email already exists error
            ctx.status = 400;
            ctx.body = 'The specified e-mail address already exists';
        } else {
            // save the Auction contained in the POST body
            const Auction = await AuctionRepository.save(AuctionToBeSaved);
            // return CREATED status code and updated Auction
            ctx.status = 201;
            ctx.body = Auction;
        }
    }

    public static async updateAuction (ctx: BaseContext) {

        // get a Auction repository to perform operations with Auction
        const AuctionRepository: Repository<Auction> = getManager().getRepository(Auction);

        // load the Auction by id
        const AuctionToBeUpdated: Auction = await AuctionRepository.findOne(ctx.params.id);

        // return a BAD REQUEST status code and error message if the Auction cannot be found
        if (!AuctionToBeUpdated) {
            
            ctx.status = 400;
            ctx.body = 'The Auction you are trying to retrieve doesn\'t exist in the db';  
        } 

        if(ctx.request.body.name) {AuctionToBeUpdated.name = ctx.request.body.name;}
        if(ctx.request.body.hashedPassword) {AuctionToBeUpdated.hashedPassword = ctx.request.body.hashedPassword;}

        // validate Auction entity
        const errors: ValidationError[] = await validate(AuctionToBeUpdated); // errors is an array of validation errors
        if (errors.length > 0) {
            // return BAD REQUEST status code and errors array
            ctx.status = 400;
            ctx.body = errors;
        } else if ( !await AuctionRepository.findOne(AuctionToBeUpdated.id) ) {
            // check if a Auction with the specified id exists
            // return a BAD REQUEST status code and error message
            ctx.status = 400;
            ctx.body = 'The Auction you are trying to update doesn\'t exist in the db';
        } else if ( await AuctionRepository.findOne({ id: Not(Equal(AuctionToBeUpdated.id)) , name: AuctionToBeUpdated.name}) ) {
            // return BAD REQUEST status code and email already exists error
            ctx.status = 400;
            ctx.body = 'The specified e-mail address already exists';
        } else {
            // save the Auction contained in the PUT body
            const Auction = await AuctionRepository.save(AuctionToBeUpdated);
            // return CREATED status code and updated Auction
            ctx.status = 201;
            ctx.body = Auction;
        }

    }

    public static async deleteAuction (ctx: BaseContext) {

        // get a Auction repository to perform operations with Auction
        const AuctionRepository: Repository<Auction> = getManager().getRepository(Auction);

        // load the Auction by id
        const AuctionToRemove: Auction = await AuctionRepository.findOne(ctx.params.id);

        if (!AuctionToRemove) {
            // return a BAD REQUEST status code and error message
            ctx.status = 400;
            ctx.body = 'The Auction you are trying to delete doesn\'t exist in the db';
        } else {
            // the Auction is there so can be removed
            await AuctionRepository.remove(AuctionToRemove);
            // return a NO CONTENT status code
            ctx.status = 204;
        }

    }

  }
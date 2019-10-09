//server.ts
import { postgresDB } from 'databases/postgres-db';
import {qaRouter} from 'routes/qa-routes';
import {restRouter} from 'routes/rest-routes';
import {wsRouter} from 'routes/ws-routes';
import * as bodyParser from 'koa-bodyparser';
import * as Koa from 'koa';
var app = require('./app')
import WebSocket = require('ws');
import webSockify = require('koa-websocket')
import http = require('http');
import Router = require('koa-router');
import { NextFunction } from 'connect';
import * as RedisSMQ from 'rsmq'
import * as redis from 'redis'
import { ConnectionOptionsReader, AdvancedConsoleLogger } from 'typeorm';

const RSMQ = new RedisSMQ({host : "localhost", port: 6379, })

const errlog = (err:string) => {
    console.log(`error log : ${err}`)
}
const log = (info:string)=>{
    console.log(`log info ${info}`)
}

const createRSMQ = async(name:string, mode:string) => {
  
    if(mode == "dev"){
        await RSMQ.createQueueAsync({qname:name})
        .then((resp)=>{
        if(resp == 1)
            log("queue created");
        }).catch(async(err)=>{
            if(err.name == "queueExists"){
            await RSMQ.deleteQueueAsync({qname:"myqueue"}).then(async()=>{
                log("existed queue delete");
                await RSMQ.createQueueAsync({qname:"myqueue"}).then(()=>{
                log("make new queue");
                })
            })
            }
        })
    }
    else if(mode == "production"){
        await RSMQ.createQueueAsync({qname:name})
        .then((resp)=>{
            if(resp == 1)
                log("queue create")
        }).catch((err)=>{
            errlog(`error : ${err}`)
        })
    }
}

const InsertTimer = (qname:string,message:string,time:number) => { 
    setInterval(()=>{sendMessage(qname,message)},time);
}

const sendMessage = async(qname:string, message:string) => {
        
    await RSMQ.sendMessageAsync({qname:qname, message:message}).then(function (resp) {
        if (resp) {
            log(`sendMessage ${resp}`)
        }
    }).catch((err)=>{
        errlog(`${err}`);
    });
}

// @ amqp pop action and return first resp
const popMessage = async(qname:string) => {
    
    await RSMQ.popMessageAsync({qname:qname}).then((resp)=>{
        if(resp['id']){
          return JSON.stringify(resp)
        }else{
          return null;
        }
    }).catch((err)=>{
        errlog(`${err}`);
    })
}

const receiveMessage = async(qname:string) => {
    
    await RSMQ.receiveMessageAsync({qname:qname}).then(async(resp) => {
        if (resp['id']) {
            return resp;	
        }
        else {
            log("No messages for me...")
        }
      });
}

const deleteMessage = async(qname:string, qid:string) => {
    await RSMQ.deleteMessageAsync({qname:qname, id:qid}).then(()=>{
        return true;
    }).catch((err)=>{
        errlog(`${err}`)
        return false;
    })
}
  

const logDeamon = async(qname:string) =>{

    await RSMQ.getQueueAttributesAsync({ qname: qname }).then((resp) =>{
      console.log("==============================================");
      console.log("=================Queue Stats==================");
      console.log("==============================================");
      console.log("visibility timeout: ", resp.vt);
      console.log("delay for new messages: ", resp.delay);
      console.log("max size in bytes: ", resp.maxsize);
      console.log("total received messages: ", resp.totalrecv);
      console.log("total sent messages: ", resp.totalsent);
      console.log("created: ", resp.created);
      console.log("last modified: ", resp.modified);
      console.log("current n of messages: ", resp.msgs);
      console.log("hidden messages: ", resp.hiddenmsgs);
    }).catch((err)=>{
      console.log(err);
      return;
    });
}
  
const subScriberDeamon = async()=>{

    let subscriber = redis.createClient();


    subscriber.on("message", (channel,message)=>{
        console.log(`Message : ${message} :: Channel ${channel}`)
    })

    subscriber.subscribe("RSMQ:rt:myqueue");
}
  
const subScribeRSMQ = async(qname:string) => {
  
    let subscriber = redis.createClient();
    
    subscriber.on("message", (channel,message)=>{
      console.log(`Message : ${message} :: Channel ${channel}`)
      
    })
  
    subscriber.subscribe(`RSMQ:rt:${qname}`);
}

const server = () =>{

    createRSMQ("order","dev");

    InsertTimer("order","this is order queue", 1000);

    logDeamon("order");

    subScribeRSMQ("order");    
}

server();
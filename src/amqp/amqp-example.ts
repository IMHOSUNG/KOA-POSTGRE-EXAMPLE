// 월요일 날 할 부분
// rabbitmq 설정 시작 
// amqp/lib 사용
import * as amqp from 'amqplib'
import * as MQConfig from './amqp-config'

export const MQConnection = async() => {
    
    let config = await MQConfig.ConnectInfo();
    let host = config['host'];
    let port = config['port'];
    let user = config['username'];
    let pw = config['password'];
    console.log(`${host} ${port} ${user} ${pw}`)

    let open = await amqp.connect(`amqp://${user}:${pw}@${host}`)
    return open
} 

export const channel = async() => {
    
    let ch = await MQConnection().then((ch)=>{
        return ch.createChannel();
    }).then((ch)=>{
        return ch;
    })
    return ch
}

export const exchanges = async() => {

    await channel().then((ch)=>{
        ch.assertExchange("","direct");
    })
}

const send = async() => {
    let con = await MQConnection();
    let ch = await con.createChannel();

    let queue = 'hello';
    let msg = "hello world"
    await ch.assertQueue(queue,{ durable : false})
    ch.sendToQueue(queue, Buffer.from(msg));
    console.log("[x] 보낸 %s", msg);

    setTimeout(() => {
        con.close();
        process.exit(0);
    }, 500);
}

const receive = async() => {
    let con = await MQConnection();
    let ch = await con.createChannel();
    
    let queue = 'hello'

    ch.assertQueue(queue,{ durable : false})
    console.log("[*] Waiting for message in %s. To exit process CTRL+C",queue);

    ch.consume(queue, (msg:amqp.ConsumeMessage)=>{
        console.log("[x] Received %s",msg.content.toString());
    })
}

const newTask = async() => {

    let con = await MQConnection();
    let ch = await con.createChannel();

    let q = 'task_queue';
    let msg = process.argv.slice(2).join('') || 'Hello World';

    // 해당 큐 있는 지 확인, 없으면 다시 만든다; 
    ch.assertQueue(q, {durable : true});
    ch.sendToQueue(q, Buffer.from(msg),{ persistent : true});
    
    setTimeout(()=>{
        con.close();
        process.exit(0);
    },500);
}
//send();
//send();
receive();


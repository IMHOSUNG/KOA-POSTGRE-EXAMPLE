import * as amqp from 'amqplib'
import * as MQConfig from './amqp-config'

const randString = () => {
    let str = Math.random()
            .toString(36)
            .replace(/[^a-z]+/g,'')
            .substr(0,5);

    return str;
}

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

const EmitMessage = async() => {

    //command 
    // command error "Run. Run. Or it will explode"

    let con = await MQConnection();
    let ch = await con.createChannel();

    let exchangeMN = 'topic_log';
    let msg_1 = randString();
    let msg_2 = randString();

    let args = process.argv.slice(2);
    console.log(args);
    let serverity_1 = 'BTC.BUY.10000';
    let serverity_2 = 'BTC.SELL.10000';

    //topic 방식
    //exchange를 topic으로 바꾸면 된다.
    ch.assertExchange(exchangeMN, 'topic', {
        durable : false
    })

    //exchage publish sell queue
    ch.publish(exchangeMN, serverity_1 , Buffer.from(msg_1));
    console.log("[x] Sent %s: '%s'", serverity_1, msg_1);

    //exchange publish buy queue
    ch.publish(exchangeMN, serverity_2 , Buffer.from(msg_2));
    console.log("[x] Sent %s: '%s'", serverity_2, msg_2);
}


const receiveBuy = async(value:string) => {
    
    let con = await MQConnection();
    let ch = await con.createChannel();

    let exchangeMN = 'topic_log';
    
    //topic 방식
    //exchange를 topic으로 바꾸면 된다.
    ch.assertExchange(exchangeMN, 'topic',{
        durable : false
    })

    let q = await ch.assertQueue('', {autoDelete : true})
    //let getq = await ch.assertQueue('', {autoDelete : true})
    console.log('[*] Waiting for logs. To exit press CTRL+C');
    let severity_1 = 'BTC.BUY.*'
    ch.bindQueue(q.queue, exchangeMN, severity_1);

    ch.consume(q.queue, (msg)=>{
        console.log(" [x] %s %s", msg.fields.routingKey,msg.content.toString());

    },{
        noAck : true
    })
}

const receiveSell = async(value:string) => {
    
    let con = await MQConnection();
    let ch = await con.createChannel();

    let exchangeMN = 'topic_log';
    
    //topic 방식
    //exchange를 topic으로 바꾸면 된다.
    ch.assertExchange(exchangeMN, 'topic',{
        durable : false
    })

    let q = await ch.assertQueue('', { exclusive:true,autoDelete : true})
    //let getq = await ch.assertQueue('', {autoDelete : true})
    console.log('[*] Waiting for logs. To exit press CTRL+C');
    let severity_1 = 'BTC.SELL.*'

    ch.bindQueue(q.queue, exchangeMN, severity_1);

    ch.consume(q.queue, (msg)=>{
        console.log(" [x] %s %s", msg.fields.routingKey,msg.content.toString());
        // 요기서 매칭 할 sell 큐를 받아서 연결 
    },{
        noAck : true
    })
}

receiveSell('1000');
receiveSell('1000');

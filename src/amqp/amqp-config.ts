import * as yaml from 'js-yaml';
import * as fs from 'fs';

export const getAMQPConfig = async():Promise<string> => {
 
    try{
        let doc = await yaml.safeLoad(fs.readFileSync('src/amqp/amqpconfig.yml','utf-8'));
        return doc;
    }
    catch (err) {
        console.log(err)
        process.exit(1);
    }
}


export const ConnectInfo = async() => {
    
    let doc = await getAMQPConfig();

    return doc['connect'];
}

export const bindingExchangeId = async(id:string) => {
    let doc = await getAMQPConfig();
    return doc['binding'][id]['exchange'];
}

export const exchange = async(id:string) => {

    let doc = await getAMQPConfig();
    let type = doc['exchange'][id]['type'];
    let name = doc['exchange'][id]['name'];
    return [type,name];
}

export const bindingExchange = async(id:string) => {
    let eid = await bindingExchangeId(id);
    return eid && exchange(eid);
}

// queue data[:binding][id][:queue] 에 넣는다.
// ???? 이해가... id 따라 값이 하나 인데 굳이??
export const bindingQueue = async(id:string) => {
    let doc = await getAMQPConfig();
    let queue = [];
    queue = doc['binding'][id]['queue'];
    console.log(queue)
    return queue;
}

export const bindingWorker = async(id:string) => {
    //??
    return null;
}

export const routingKey = async(id:string) => {
    let q = await bindingQueue(id)
    return q[0];
}

// topics 를 worker 내부에서 사용하는 곳이 없음
// 함수 왜 만든거지... 레거시 코드 인가
export const topics = async(id:string) => {
    let doc = await getAMQPConfig();
    return doc['binding'][id]['topic'].split(',');
}

export const queue = async(id:string) => {
    let doc = await getAMQPConfig();
    return (doc['channel'] && doc['channel'][id]) || {};
}


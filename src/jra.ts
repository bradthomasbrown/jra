class Client {

    url:string

    constructor(url:string) {
        this.url = url;
    }

    async request(method:string, params:any):Promise<string>
    async request(...args:any):Promise<Array<string>>
    async request(...args:any):Promise<string|Array<string>> {
        const error = new Error();
        error.stack = error.stack!.split('\n').toSpliced(0, 2).join('\n');
        const result = await Client.request(this.url, ...args).catch(e => e);
        if (result instanceof AggregateError) {
            result.stack! += "\n" + error.stack;
            for (let i = 0; i < result.errors.length; i++) result.errors[i].stack += "\n" + error.stack;
            throw result;
        } else if (result instanceof Error) {
            result.stack! += "\n" + error.stack;
            throw result;
        }
        return result;
    }

    static async request(url:string, method:string, params:any):Promise<string>
    static async request(url:string, ...args:any):Promise<Array<string>>
    static async request(url:string, ...args:any):Promise<string|Array<string>> {
        const requests:Array<{ method:string, params:Array<any> }> = [];
        if (args.length == 2) {
            requests.push({ method:args[0], params:args[1] });
            const [value] = await send(url, ...requests);
            return value;
        } else {
            for (let i = 0; i < args.length; i+=2) requests.push({ method:args[i], params:args[i + 1] });
            const values = await send(url, ...requests);
            return values;
        }
    }

}

// recursive value replacer
// this should be in some other library i think
function _fa5f71_(_02_:any, replacer:(value:any)=>any) {
    if (typeof _02_ == "object") {
        const _7e_:any = {};
        for (const [key, value] of Object.entries(_02_)) {
            if (typeof value === "object") _7e_[key] = _fa5f71_(value, replacer);
            else _7e_[key] = replacer(value);
        }
        return _7e_;
    } else {
        return replacer(_02_);
    }
}

// send single request
async function sendSingleRequest(url:string, requestInit:RequestInit, request:{ method:string, params:any }) {
    requestInit.body = JSON.stringify({
        jsonrpc: "2.0",
        method: request.method,
        params: request.params,
        id: 0
    });
    const response = await fetch(url, requestInit);
    const json = await response.json();
    if ("error" in json) throw new Error(`${json.error.code}: ${json.error.message}`, { cause: { method: request.method, params: request.params, data: json.error.data } });
    return json.result;
}

// send batched requests
async function sendBatchedRequests(url:string, requestInit:RequestInit, requests:Array<{ method:string, params:any }>) {
    const _02_ = new Array(requests.length);
    for (let i = 0; i < requests.length; i++) {
        _02_[i] = {};
        _02_[i].jsonrpc = "2.0";
        _02_[i].method = requests[i]!.method;
        _02_[i].params = requests[i]!.params;
        _02_[i].id = i;
    }
    requestInit.body = JSON.stringify(_02_);
    const response = await fetch(url, requestInit);
    const json = await response.json();
    const errors:Array<Error> = [];
    const _54_ = new Array(requests.length);
    const _a8_:Set<number> = new Set();
    for (let i = 0; i < _02_.length; i++) {
        const response = json.find((_fc_:any) => _fc_?.id == i);
        if (response === undefined) { errors.push(new Error(`-32000: response missing for request ${i}`, { cause:{ method:_02_[i].method, params:_02_[i].params, id:_02_[i].id } })); _a8_.add(i); continue; }
        if ("error" in response) { errors.push(new Error(`${response.error.code}: ${response.error.message}`, { cause:{ method:_02_[i].method, params:_02_[i].params, id:_02_[i].id, ...(response.error.data ? { data: response.error.data } : {}) } })) }
        _54_[i] = response.result;
    }
    if (errors.length) throw new AggregateError(errors, _a8_.size > 0 ? `-32000: responses missing for requests (${[..._a8_].join(' ')})`: undefined);
    return _54_;
}

async function send(url:string, ...requests:Array<{ method:string, params:any }>) {
    const headers = { "Content-Type": "application/json" };
    const requestInit = { method: "POST", headers };
    if (requests.length == 1) return await sendSingleRequest(url, requestInit, requests[0]!);
    else return await sendBatchedRequests(url, requestInit, requests);
}

export { Client, _fa5f71_ };
const map = function*<T1, T2>(t1s: Generator<T1>, fun: (t1: T1)=> T2): Generator<T2> {
    for (const v of t1s) {
        yield fun(v);
    }
};

const filter = function*<T1>(t1s: Generator<T1>, pred: (t1: T1)=> boolean): Generator<T1> {
    for (const v of t1s) {
        if (pred(v)) {
            yield v;
        }
    }
};

const forEach = function<T1>(t1s: Generator<T1>, func: (t1: T1)=> void): void {
    for (const v of t1s) {
        func(v);
    }
};

const toArray = function<T1>(t1Gen: Generator<T1>): T1[] {
    let ts = [];
    for (const v of t1Gen) {
        ts.push(v);
    }
    return ts;
};

export const from = <T>(gen: Generator<T>) => ({
    filter: (pred: (t: T)=> boolean) => from(filter(gen, pred)),
    map: <T1>(fun: (t: T)=> T1) => from(map(gen, fun)),
    forEach: (fun: (t: T)=> void) => forEach(gen, fun),
    toArray: () => toArray(gen),
    raw: () => gen,
});

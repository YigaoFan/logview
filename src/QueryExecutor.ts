import { Message } from "./message";
import { log } from "./utils";

export enum Operator {
    equal = 'equal',
    notEqual = 'notEqual',
    contains = 'contains',
}

export enum Combinator {
    and = 1,
    or = 0,
    lowestOrderGuard = -1,
}

export const toCombinatorEnum = function(s: string): Combinator {
    switch (s) {
        case 'and':
            return Combinator.and;
        case 'or':
            return Combinator.or;
        default:
            throw new Error(`not support to convert ${s}`);
    }
};

export const toOperatorEnum = function(s: string): Operator {
    switch (s) {
        case '=':
            return Operator.equal;
        case '!=':
            return Operator.notEqual;
        case 'contains':
            return Operator.contains;
        default:
            throw new Error(`not support to convert ${s}`);
    }
};

export const getCombinatorMap = function() {
    return [ 'and', 'or', ];
};

export const getOperators = function() {
    return [ '=', '!=', 'contains', ];
};

export type Clause = readonly [string, Operator, string];

class QueryItem {
    public constructor(private clause: Clause | boolean, public validRange: [number, number]/* left, right is included */) {
    }

    public executeOn(message: Message): boolean {
        // log('QueryItem execute', this.clause);
        if (this.clause instanceof Array) {
            const result = message.verify(this.clause[0], this.clause[1], this.clause[2]);
            this.clause = result;
        }
        // log('result', this.clause);
        return this.clause as boolean;
    }

    public update(result: boolean, range: [number, number]) {
        this.clause = result;
        this.validRange = range;
    }

    public get left(): number {
        return this.validRange[0];
    }

    public get right(): number {
        return this.validRange[1];
    }

    public set left(value: number) {
        this.validRange[0] = value;
    }

    public set right(value: number) {
        this.validRange[1] = value;
    }
}

export class QueryExecutor {
    private mClauses: Clause[] = [];
    private mCombinators: Combinator[] = [];

    public addClause(clause: Clause) {
        this.mClauses.push(clause);
    }

    public addCombinator(combinator: Combinator) {
        this.mCombinators.push(combinator);
    }

    public *execute(messages: Generator<Message>): Generator<Message> {
        const exeOrder: [Combinator, number][] = [[Combinator.lowestOrderGuard, -1],];// exe order from high to low
        for (let i = 0; i < this.mCombinators.length; i++) {
            const x = this.mCombinators[i];
            for (let i = 0; i < exeOrder.length; i++) {
                const y = exeOrder[i][0];
                if (x > y) {
                    exeOrder.splice(i, 0, [x, i]);
                    break;
                }
            }
        }
        exeOrder.pop(); // remove the lowest guard
        
        const that = this;
        const query = function(msg: Message): boolean {
            // args will be changed internal(executeOn), so we need use a copy in each query
            const args = that.mClauses.map((x, i) => new QueryItem(x, [i, i]));
            for (const exe of exeOrder) {
                const arg1 = args[exe[1]];
                const arg2 = args[exe[1] + 1];
                // impact range
                const l = arg1.left;
                const r = arg2.right;
                let result: boolean;
                switch (exe[0]) {
                    case Combinator.and:
                        {
                            const b1 = arg1.executeOn(msg);
                            result = b1;
                            if (b1) {
                                const b2 = arg2.executeOn(msg);
                                result = b1 && b2;
                            }
                            break;
                        }
                        case Combinator.or:
                            {
                                const b1 = arg1.executeOn(msg);
                                result = b1;
                                if (!b1) {
                                    const b2 = arg2.executeOn(msg);
                                    result = b1 || b2;
                                }
                                break;
                            }
                }
                args[l].update(result!, [l, r]);
                args[r].update(result!, [l, r]);
            }
            return args[0].executeOn(msg);
        };
        for (const m of messages) {
            if (query(m)) {
                yield m;
            }
        }
    }

    public clearData() {
        this.mClauses.length = 0;
        this.mCombinators.length = 0;
    }
}
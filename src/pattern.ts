// pattern to analyze log correctness
import { Message } from './message';

export const patterns:((request: Message, response: Message) => boolean)[] = [];

const pattern0: ((request:Message, response: Message) => boolean) = function(request:Message, response: Message) {
        const d1 = request.time;
        const d2 = response.time;
        return (d2.getTime() - d1.getTime()) / 1000 > 10;      
};

patterns.push(pattern0);


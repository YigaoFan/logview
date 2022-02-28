export class Message {
    private mTime: Date;

    public get time() {
        return this.mTime;
    }
    
    constructor(time: Date, milliSeconds: number) {
        this.mTime = time;
        this.mTime.setMilliseconds(milliSeconds);
    }
}
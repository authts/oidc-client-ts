export class ClockService {
    public getEpochTime() {
        return Promise.resolve(Date.now() / 1000 | 0);
    }
}

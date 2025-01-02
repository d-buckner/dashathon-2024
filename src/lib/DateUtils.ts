const MS_IN_DAY = 86400000;
const MS_IN_MINUTE = 1000 * 60;

function divideTime(ms: number, divisor: number) {
    return Number((ms / divisor).toFixed(2));
}

export function msToDays(ms: number) {
    return divideTime(ms, MS_IN_DAY);
}

export function getDeltaMS(oldDate: Date, newDate: Date): number {
    return newDate.getTime() - oldDate.getTime();
}

export function msToMins(ms: number): number {
    return divideTime(ms, MS_IN_MINUTE);
}

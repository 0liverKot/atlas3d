export class Queue<T> {
    private data: T[] = [];

    enqeue(element: T): void {
        this.data.push(element)
    }

    dequeue(): T | undefined {
        return this.data.shift();
    }

    leap(item: T): void {
        
        const index = this.data.indexOf(item)
        if (index === -1) return;
        
        this.data = this.data.filter((_item, ind) => ind !==index)
        this.data.push(item)
    }

    clear(): void {
        this.data = []
    }
}
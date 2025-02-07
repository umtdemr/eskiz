export class Node {
    private _next: Node|null = null
    private _prev: Node|null = null
    private _value: unknown
    
    constructor(value: unknown) {
        this._value = value
    }
    
    get next(): Node|null {
        return this._next
    }
    set next(node: Node|null) {
        this._next = node
    }
    get prev(): Node|null {
        return this._prev
    }
    set prev(node: Node|null) {
        this._prev = node
    }
    get value(): unknown {
        return this._value
    }
    set value(val: unknown) {
        this._value = val
    }
}

export class LinkedList {
    private _root: Node|null = null;
    private _tail: Node|null = null;
    private _nodeCount: number = 0;
    
    constructor() {
    }

    /**
     * Adds item to linked list.
     * @param value
     */
    add(value: unknown) {
        this.addAt(this._nodeCount, value)
    }

    /**
     * Prepends item to linked list.
     * @param value
     */
    prepend(value: unknown) {
        this.addAt(0, value)
    }

    
    /**
     * Adds given value in given index
     * @param index - Where to add
     * @param value - Value to add
     */
    addAt(idx: number, value: unknown) {
        if (idx < 0) {
            idx = this._nodeCount
        }
        const addingNode = new Node(value)

        if (!this._root) {
            this._root = this._tail = addingNode;
            this._nodeCount++;
            return;
        }

        if (idx === 0) {
            const tempOld = this._root
            this._root = addingNode
            if (tempOld) {
                this._root.next = tempOld
                tempOld.prev = this._root
            }
        } else if (idx >= this._nodeCount) {
            addingNode.prev = this._tail
            this._tail!.next = addingNode
            this._tail = addingNode
        } else {
            const existingNode = this.getNodeAt(idx);
            addingNode.prev = existingNode!.prev!
            addingNode.next = existingNode
            existingNode!.prev!.next = addingNode
            existingNode!.prev = addingNode
        }
        this._nodeCount++
    }

    /**
     * Removes particular item with given index
     * @param idx Index of the item
     */
    removeAt(idx: number): [boolean, unknown] {
        // empty list or invalid index
        if (!this._root || idx < 0 || idx >= this._nodeCount) {
            return [false, null];
        }
        let removedNode = null;
        if (idx === 0) {
            removedNode = this._root
            this._root = this._root.next
            if (this._root) {
                this._root.prev = null
            } else {
                // list is now empty
                this._tail = null
            }
        } else if (idx === this._nodeCount - 1) {
            removedNode = this._tail
            this._tail = this._tail!.prev
            this._tail!.next = null
        } else {
            removedNode = this.getNodeAt(idx);
            removedNode!.prev!.next = removedNode!.next;
            removedNode!.next!.prev = removedNode!.prev;
        }

        this._nodeCount--;
        return [true, removedNode?.value]
    }

    private getNodeAt(idx: number): Node|null {
        let next = this._root;
        let countIdx = 0;
        while (next) {
            if (idx === countIdx) {
                return next
            }
            next = next.next
            countIdx++
        }
        return null
    }

    /**
     * Clears the list.
     */
    clear() {
        this._root = this._tail = null;
        this._nodeCount = 0;
    }

    /**
     * Searchs and returns given item's value in given index.
     * @param searchVal Searching value
     * @returns 
     */
    find(searchVal: unknown): unknown {
        return this.findCb((val: unknown) => val === searchVal)
    }

    /**
     * Searches items with given callback.
     * @param cb Callback method to search item
     * @returns If found, returns value of element
     */
    findCb(cb: (value: unknown) => boolean): unknown{
        let current = this._root

        while (current !== null) {
            if (cb(current.value)) {
                return current.value
            }
            current = current.next
        }

        return undefined;
    }

    /**
     * Returns array representation of list.
     * @returns Array representation of list.
     */
    toArray() {
        const arr = []
        let current = this._root

        while (current !== null) {
            arr.push(current.value)
            current = current.next
        } 

        return arr
    }

    get length() {
        return this._nodeCount
    }
}
/**
 * Author: Henry Price
 * Website: Phanxgames.com
 * ---------------------------------
 * Dictionary
 */
export class Dictionary {

    __private__:DictionaryInner;

    constructor(cacheKeys:Boolean=false) {

        //Make the internal data non enumerable.
        Object.defineProperty(this, "__private__", {
            value: {},
            enumerable: false
        });

        this.__private__.cacheKeys = cacheKeys;
        this.__private__.invalidateKeys = true;
        this.__private__.keys = null;


    }

    /**
     * @internal
     */
    [Symbol.iterator] = function*() {
        let keys = this.getKeys();//Object.keys(this);
        for (let key of keys) {
            yield this[key];
        }
    };


    /**
     * Use to loop through key, value pairs.
     * <pre>
     *     for (let [key,value] of dict.entries()) {
     *          //...
     *     }
     * </pre>
     * @returns Iterator
     */
    entries():any {
        let self = this;
        return {
            [Symbol.iterator]: function*() {
                let keys = self.getKeys();//Object.keys(this);
                for (let key of keys) {
                    yield [key,self[key]];
                }
            }
        };
    }


    /**
     * Checks if collection has this key.
     * @param {any} key
     * @returns {Boolean}
     */
    has(key:any):Boolean {

        if (key==null) return false;
        if (typeof key == "string" && key.indexOf("__private__") >= 0)
            return false;

        return this.hasOwnProperty(key);

    }


    /**
     * Returns number of items in collection.
     * @returns {number} c
     */
    size():number {
        return this.getKeys().length;
    }

    /**
     * Returns number of items in collection.
     * @returns {number} c
     */
    get length():number {
        return this.size();
    }

    /**
     * Invalidates keys to recalculate.
     */
    invalidate():void {
        this.__private__.invalidateKeys = true;
    }

    /**
     * @ignore
     * @alias getKeys()
     */
    keys():Array<any> {
        return this.getKeys();
    }

    /**
     * Return array of keys
     * @returns {Array<any>} array of keys
     */
    getKeys():Array<any> {
        if (!this.__private__.cacheKeys)
            return Object.keys(this);

        if (this.__private__.invalidateKeys ||
            this.__private__.keys == null) {

            this.__private__.invalidateKeys = false;
            this.__private__.keys = Object.keys(this);
        }
        return this.__private__.keys;
    }

    /**
     * Returns values within collection
     * @returns {Array<any>}
     */
    values():Array<any> {
        let arr:Array<any> = [];
        let keys = this.getKeys();
        for (let key in keys) {
            arr.push(this[key]);
        }
        return arr;
    }

    /**
     * Remove the key from collection.
     * @param {any} key
     */
    remove(key:any):void {
        this.invalidate();
        delete this[key];
    }

    /**
     * Store value at the key.  The key has been tested with strings,
     *   but may support other types.
     * Value may be any data type.
     * @param {any} key - key of the key/value pair
     * @param {any} value - value of the key/value pair
     */
    set(key:any,value:any):void {
        this.invalidate();
        this[key] = value;
    }

    /**
     * Returns the value
     * @param {any} key
     * @returns {any} the value
     */
    get(key:any):any {
        return this[key];
    }

    /**
     * Returns the default value if key is not found or is null.
     * @param {string} key - key to lookup
     * @param defaultValue - the default value
     * @returns value of key or default value
     */
    getDefault(key:any,defaultValue:any):any {
        if (this.has(key)) {
            return this[key];
        } else {
            return defaultValue;
        }
    }

    /**
     * Removes all keys from collection.
     * This is blocking.
     */
    empty():void {
        this.forEach((key:any,value:any):void => {
            this.remove(key);
        })
    }

    /**
     * @alias empty()
     */
    clear():void {
        this.empty();
    }

    /**
     * Non-blocking method to remove all keys from collection.
     * @param {Function} cbComplete - cbComplete()
     */
    asyncEmpty(cbComplete:Function=null):Promise<null> {

        return new Promise(async (resolve) => {
            await this.asyncForEach(
                (key:any,value:any,next:Function):void =>
                {
                    this.remove(key);
                    next();
                }
            );
            if (cbComplete!=null)
                cbComplete();
            else
                resolve();
        });


    }

    /**
     * @ignore
     * @alias each
     */
    forEach(cb:Function):void {
        this.each(cb);
    }

    /**
     * Blocking loop helper method.
     * @param {Function} cbEach - cbEach(key:any,value:any)
     */
    each(cbEach:Function):void {
        for (let key in this) {
            if (this.has(key)) {
                if (cbEach(key,this[key]) === false) break;
            }
        }

    }


    /**
     * Non-blocking loop helper method.
     * Must call cbNext within cbIterator to move to the next item in the collection.
     * Example:
     * <pre>
     *     await collection.asyncForEach(
     *        (key:any,value:any,cbNext:Function) => {
	 *          console.log(key,value);
	 * 	       	cbNext();
	 *        });
     * </pre>
     * @param {Function} cbIterator - cbIterator(key:any,value:any,cbNext:Function)
     * @param {Function} cbComplete - Optional - cbComplete()
     * @returns {Promise<null>}
     */
    asyncForEach(cbIterator:Function, cbComplete:Function=null):Promise<null>  {

        return new Promise((resolve) => {

            let keys:Array<any> = this.getKeys();
            let counter:number = 0;
            let len:number = keys.length;

            let next:Function = ():void => {
                if (counter < len) {
                    process.nextTick(step);
                    //setTimeout(step,100);
                } else {
                    if (cbComplete!=null)
                        cbComplete();
                    else
                        resolve();
                    return;
                }
            };

            let step:Function = ():void => {
                if (counter < len ) {
                    let key = keys[counter++];
                    if (cbIterator(key, this[key], next) == false) {
                        if (cbComplete!=null)
                            cbComplete();
                        else
                            resolve();
                        return;
                    }

                } else {
                    if (cbComplete!=null)
                        cbComplete();
                    else
                        resolve();
                    return;
                }
            };
            step();

        });


    }





}

/**
 * @internal
 */
interface DictionaryInner {
    cacheKeys:Boolean;
    invalidateKeys:Boolean;
    keys:Array<any>
}
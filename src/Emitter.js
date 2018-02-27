import {Subject} from 'rx-lite'

export default new class {
    constructor() {
        this.listeners = new Map();
        this.newlistener = new Subject()
    }

    addListener(label, callback, vm) {
        if(typeof callback == 'function'){
            this.listeners.has(label) || this.listeners.set(label, []);
            this.listeners.get(label).push({callback: callback, vm: vm});
            this.newlistener.onNext()
            return true
        }

        return false
    }

    removeListener(label, callback, vm) {
        let listeners = this.listeners.get(label),
            index;

        if (listeners && listeners.length) {
            index = listeners.reduce((i, listener, index) => {
                return (typeof listener.callback == 'function' && listener.callback === callback && listener.vm == vm) ?
                    i = index :
                    i;
            }, -1);

            if (index > -1) {
                listeners.splice(index, 1);
                this.listeners.set(label, listeners);
                return true;
            }
        }
        return false;
    }

    emit(label, ...args) {
        let listeners = this.listeners.get(label);
        if (listeners && listeners.length) {
            listeners.forEach((listener) => {
                listener.callback.call(listener.vm,...args)
            });
            return true;
        }
        return false;
    }

}
import Emitter from './Emitter'


export default class{

    constructor(connection, store) {

        this.Socket = connection

        if(store) this.store = store;
        Emitter.newlistener.debounce(500).subscribe(()=>{
            this.onEvent()
        })

    }

    onEvent(){

        Emitter.listeners.forEach((l,k)=>{
            this.Socket.on(k,(data)=>{
              Emitter.emit(k,data)
              if(this.store) this.passToStore('SOCKET_'+k, data)
            })
        })
        // this.Socket._onSCEvent = (event,data) => {

        //     Emitter.emit(event, data);
        //     if(this.store) this.passToStore('SOCKET_'+event, data)
        // };


/*        ["connect", "error", "disconnect", "reconnect", "reconnect_attempt", "reconnecting", "reconnect_error", "reconnect_failed", "connect_error", "connect_timeout", "connecting", "ping", "pong"]
            .forEach((value) => {
                this.Socket.on(value, (data) => {
                    Emitter.emit(value, data);
                    if(this.store) this.passToStore('SOCKET_'+value, data)
                })
            })*/
    }

    passToStore(event, payload){
        if(!event.startsWith('SOCKET_')) return

        for(let namespaced in this.store._mutations) {
            let mutation = namespaced.split('/').pop()
            if(mutation === event.toUpperCase()) this.store.commit(namespaced, payload)
        }

        for(let namespaced in this.store._actions) {
            let action = namespaced.split('/').pop()

            if(!action.startsWith('socket_')) continue

            let camelcased = 'socket_'+event
                    .replace('SOCKET_', '')
                    .replace(/^([A-Z])|[\W\s_]+(\w)/g, (match, p1, p2) => p2 ? p2.toUpperCase() : p1.toLowerCase())

            if(action === camelcased) this.store.dispatch(namespaced, payload)
        }
    }

    clone(obj) {
      if (obj === null || typeof(obj) !== 'object' || 'isActiveClone' in obj)
        return obj;

      if (obj instanceof Date)
        var temp = new obj.constructor(); //or new Date(obj);
      else
        var temp = obj.constructor();

      for (var key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
          obj['isActiveClone'] = null;
          temp[key] = this.clone(obj[key]);
          delete obj['isActiveClone'];
        }
      }

      return temp;
    }
}

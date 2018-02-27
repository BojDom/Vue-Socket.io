import Emitter from './Emitter'


export default class{

    constructor(connection, store) {

        this.Socket = connection

        if(store) this.store = store;


        this.onEvent()

        Emitter.newlistener.subscribe(l=>{
            if (l.added)
                this.Socket.on(l.label,(data)=>{
                    Emitter.emit(l.label,data)
                })
            else this.Socket.off(l.label)
        })

    }

    onEvent(){
        ["connect", "error", "disconnect", "reconnect", "reconnect_attempt", "reconnecting", "reconnect_error", "reconnect_failed", "connect_error", "connect_timeout", "connecting", "ping", "pong"]
            .forEach((value) => {
                this.Socket.on(value, (data) => {
                    Emitter.emit(value, data);
                    if(this.store) this.passToStore('SOCKET_'+value, data)
                })
            })
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
}

import Observer from './Observer'
import Emitter from './Emitter'

export default {

    install(Vue, connection, store){

        if(!connection) throw new Error("[Vue-Socket.io] cannot locate connection")

        let observer = new Observer(connection, store)

        Vue.prototype.$socket = observer.Socket;

        Vue.mixin({
            created(){
                let sockets = this.$options['sockets'];
                this.$socket.on = (eventName,cb)=>{
                    Emitter.addListener(eventName, cb,  this)
                }

                if(sockets){
                    Object.keys(sockets).forEach((key) => {
                        Emitter.addListener(key, sockets[key],  this)
                    });
                }
            },
            beforeDestroy(){
                let sockets = this.$options['sockets']

                if(sockets){
                    Object.keys(sockets).forEach((key) => {
                        Emitter.removeListener(key, sockets[key],  this)
                    });
                }
            }
        })

    }

}



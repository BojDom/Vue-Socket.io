import Emitter from './Emitter'
import {observe, observable, when} from 'mobx';
import {get} from 'lodash';
export default  class vso {
    constructor(connection,store){
        this.connection = connection;
        this.store = store;
        observe(Emitter.listeners,observed=>{
            console.log(observed)
            if (observed.type==='add')
            connection.on(observed.name,data=>{
                Emitter.emit(observed.name,data)
            })
            else if (observed.type=='delete') {
                connection.off(observed.name)
            }
        })
    }
    install(Vue){

        if(!this.connection) throw new Error("[Vue-Socket.io] cannot locate connection")
        
        Vue.prototype.$authState = observable.box(false);
        this.connection.on('authStateChange',(s)=>{
            Vue.prototype.$authState.set( s.newState === this.connection.AUTHENTICATED )
        })
        if (this.store){
            Object.keys(this.store._mutations).forEach(k => {
                if (k.startsWith('SOCKET_')) {
                    Emitter.addListener(k.replace('SOCKET_',''),data=>{
                        this.store.commit('SOCKET_'+k.toUpperCase(),data)
                    },  {_uid:'store'})
                }
                if (k==='SET_CONNECTION_STATE'){
                    (['connect','error','disconnect','connecting'])
                    .forEach(ev=>{this.connection.on(ev,val=>{
                        this.store.commit(k,ev)
                    })})
                }
            })
        }

        Vue.prototype.$socket = this.connection;

        Vue.mixin({
            created(){
                let sockets = this.$options['sockets'];

                if(sockets){
                    Object.keys(sockets).forEach( async (key) => {
                        if (key.startsWith('channel_')){
                            await when(()=>this.$authState==true);
                            let id = get(this.$socket,'authToken._id');
                            let name = key.replace('channel_','');
                            Emitter.channels.has(this._uid) || Emitter.channels.set(this._uid,{});
                            let c = Emitter.channels.get(this._uid);
                            c[name] = this.$socket.subscribe(`priv/${id}/${name}`);
                            c[name].watch(data=>sockets[key].call(this,data));
                        }
                        else Emitter.addListener(key, sockets[key],  this)
                    });
                }
            },
            beforeDestroy(){
                let sockets = this.$options['sockets']

                if(sockets){
                    Emitter.removeListeners(this);
                    let c = Emitter.channels.get(this._uid);
                    if (!c) return;
                    Object.keys(c).forEach(name=>{
                        //c[name].unsubscribe()
                        c[name].unwatch(sockets[name]);
                        (c[name].watchers()).length < 1 && c[name].unsubscribe();
                    })
                }
                
            }
        })

    }

}




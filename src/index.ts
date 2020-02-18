import { ApolloServer, gql } from 'apollo-server'
import { promises } from 'fs'
const { readFile, writeFile } = promises

let items = {
    "7": {
        name:"product",
        description: "description",
        price:"9990.99",
        baseCurrency: "gbp"
    },
    "10": {
        name:"product",
        description: "description",
        price:"9990.99",
        baseCurrency: "gbp"
    }
}

const sessions = {
    '1234': {
        items:[{id:"7",quantity:1}]
    }
}

const typeDefs = gql`
    type Item {
        id: ID,
        name: String
        description: String,
        price: Float,
        baseCurrency: String,
        quantity: Int
    }

    input inputItem {
        id: ID,
        name: String
        description: String,
        price: Float,
        baseCurrency: String,
        quantity: Int
    }

    type messageRespose {
        status: Int
        message: String
        data: [Item]
    }

    type Session {
        id: ID,
        items: [Item]

    }


    type Query {
        items(id:[String]): [Item]
        session(id:String): Session
    }

    type Mutation {
        items(items:[inputItem]) : messageRespose
        session(id:String, items:[inputItem]) : Session
    }
`


const resolvers = {
    Query: {
        items: (parent:any, args:any, context:any, info:any) => {
            //@ts-ignore
            if (!args.id) return Object.keys(items).map(key => {
                return {
                    //@ts-ignore
                    id:key, ...items[key]

                }

            })

            if (typeof args.id === 'string') args.id = [args.id]

            //@ts-ignore
            return args.id.map(key => {
                if (args.id.indexOf(key) !== -1) return  {
                    //@ts-ignore
                    id:key, ...items[key]
                }
            })
        },
        session: (parent:any, args:any, context:any, info:any) => {
            //@ts-ignore
            if (!sessions[args.id]) return

            return {
                id: args.id,
                //@ts-ignore
                items: sessions[args.id].items.map(item => {
                    return {
                        //@ts-ignore
                        id: item.id, ...items[item.id], quantity:item.quantity
                    }
                })
            }

        }
    },
    Mutation: {
        items: (parent:any, args:any, context:any, info:any) => {

            //@ts-ignore
            args.items.forEach(item => items = {...items, [Math.floor(Math.random() * 100)]: item} )
            
            return {
                status:200,
                message: 'OK',
                data: args.items
            }
        },
        session: (parent:any, args:any, context:any, info:any) => {

            if(args.items.length > 0){
                //@ts-ignore
                let cache = [], toDelete = []

                //@ts-ignore
                args.items.forEach((item, i) => {
                    //@ts-ignore
                    if (cache.indexOf(item.id) !== -1) {
                        toDelete.push(i)
                        return item.quantity += 1
                    }
                    cache.push(item.id)
                })

                if (toDelete.length > 0){
                    //@ts-ignore
                    toDelete.forEach(index => args.items.splice(index,1))
                }

                toDelete = []

                //@ts-ignore
                sessions[args.id].items.forEach((item,i) => {
                    //@ts-ignore
                    args.items = args.items.filter((arg,j) => {
                        if (arg.id === item.id) {
                            item.quantity += arg.quantity
                            if (item.quantity < 1) toDelete.push(i)
                            return
                        }
                        //@ts-ignore
                        if (arg.quantity < 1 && !sessions[args.id].items.some(item => item.id === arg.id ) ){
                            // @ts-ignore
                            // args.items.splice(j, 1)
                            return
                        }
                        return arg
                    })
                })

                if (toDelete.length > 0){
                    //@ts-ignore
                    toDelete.forEach(index => sessions[args.id].items.splice(index, 1))
                }
                
                if (args.items.length > 0){
                    //@ts-ignore
                    sessions[args.id].items = [...sessions[args.id].items, ...args.items]
                }

                return {
                    id: args.id,
                    //@ts-ignore
                    items: sessions[args.id].items.map((item,i) => { 
                        //@ts-ignore
                        return {id: item.id, ...items[item.id],quantity:sessions[args.id].items[i].quantity } 
                    })
                }
                

            }
        }
    }
}

const server = new ApolloServer({ typeDefs, resolvers })

server.listen().then(({ url }) => {
    console.log(`🚀  Server ready at ${url}`);
})
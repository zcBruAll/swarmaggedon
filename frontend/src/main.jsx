import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './assets/style/index.css'
import App from './App.jsx'
import { InMemoryCache, ApolloClient, gql, HttpLink } from '@apollo/client'
import { ApolloProvider, useQuery } from "@apollo/client/react"
import './i18n/index.js'

const client = new ApolloClient({
  link: new HttpLink({ uri: "/api/graphql" }),
  cache: new InMemoryCache()
})
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ApolloProvider client={client}>
      <App />
    </ApolloProvider>
  </StrictMode>
)

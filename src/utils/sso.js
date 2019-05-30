import Client from "./sparcsssov2-node"

const client = new Client(process.env.SSO_CLIENT_ID, process.env.SSO_SECRET, false) // TODO: MOVE TO DOTENV

export default client

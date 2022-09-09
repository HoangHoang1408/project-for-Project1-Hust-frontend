import {
  ApolloClient,
  from,
  gql,
  HttpLink,
  InMemoryCache,
} from "@apollo/client";
import { setContext } from "@apollo/client/link/context";
import jwtDecode from "jwt-decode";
import { SERVER_URL } from "../config";
import { loginStatusVar } from "./reactiveVar/loginStatus";
const httpLink = new HttpLink({
  uri: `${SERVER_URL}/graphql`,
  credentials: "include",
});
const zeroClient = new ApolloClient({
  link: from([httpLink]),
  cache: new InMemoryCache(),
});
type JwtDecodedObject = {
  exp: number;
};
const getAccessToken = async (): Promise<string | null> => {
  const oldAccessToken = loginStatusVar().accessToken;
  if (!oldAccessToken) return null;
  const { exp } = jwtDecode<JwtDecodedObject>(oldAccessToken);
  if (exp > Date.now() / 1000 + 1.2) return oldAccessToken;
  const { data } = await zeroClient.query({
    query: gql`
      query NewAccessTokenQuery($input: NewAccessTokenInput!) {
        newAccessToken(input: $input) {
          accessToken
          ok
          error {
            message
          }
        }
      }
    `,
    variables: {
      input: {
        accessToken: oldAccessToken,
      },
    },
  });
  const newAccessToken = data["accessToken"];
  loginStatusVar({
    accessToken: newAccessToken,
    isLoggedIn: true,
  });
  return newAccessToken;
};
const headersTokenLink = setContext(async (_, { headers = {} }) => {
  const accessToken = await getAccessToken();
  return {
    headers: {
      ...headers,
      ACCESS_TOKEN: accessToken,
    },
  };
});
export const client = new ApolloClient({
  link: from([headersTokenLink, httpLink]),
  cache: new InMemoryCache(),
  connectToDevTools: true,
});

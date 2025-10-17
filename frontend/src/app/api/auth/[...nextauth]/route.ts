import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { authApi } from "@/lib/api";

const authOptions: NextAuthOptions = {
  providers: [
    // Credentials Provider (Email/Password)
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Missing credentials");
        }

        try {
          // Call your backend API
          const response = await authApi.login({
            email: credentials.email,
            password: credentials.password
          });


          if (response.success && response.data) {
            const token = response.data.token;

            // Return user object with token
            const userObj = {
              id: response.data.user.id.toString(),
              email: response.data.user.email,
              name: response.data.user.name,
              image: response.data.user.profile_image,
              accessToken: token,
              user: response.data.user
            };


            return userObj;
          } else {
            throw new Error(response.message || "Login failed");
          }
        } catch (error: any) {
          console.error('❌ Credentials auth error:', error);
          throw new Error(error.message || "Authentication failed");
        }
      }
    }),

    // Firebase Custom Provider
    CredentialsProvider({
      id: "firebase",
      name: "Firebase",
      credentials: {
        idToken: { label: "ID Token", type: "text" }
      },
      async authorize(credentials) {
        if (!credentials?.idToken) {
          throw new Error("Missing Firebase ID token");
        }

        try {
          // Call your backend to verify Firebase token
          const response = await authApi.firebaseLogin(credentials.idToken);

          if (response.success && response.data) {
            const token = response.data.token || response.data.accessToken;

            const userObj = {
              id: response.data.user.id.toString(),
              email: response.data.user.email,
              name: response.data.user.name,
              image: response.data.user.profile_picture,
              accessToken: token,
              user: response.data.user
            };


            return userObj;
          }

          throw new Error(response.message || "Firebase login failed");
        } catch (error: any) {
          console.error('❌ Firebase auth error:', error);
          throw new Error(error.message || "Firebase authentication failed");
        }
      }
    })
  ],

  callbacks: {
    async jwt({ token, user, account, trigger, session }) {
      // Initial sign in
      if (user) {
        const accessToken = (user as any).accessToken;
        token.accessToken = accessToken;
        token.user = (user as any).user;
        token.id = (user as any).id;
        token.email = (user as any).email;
        token.name = (user as any).name;
      }

      // Handle session update (when updateSession is called)
      if (trigger === "update" && session) {

        // Merge updated user data into token
        if (session.user) {
          token.user = {
            ...(token.user || {}),
            ...session.user,
          };
        }
      }

      return token;
    },
    async session({ session, token }) {

      // Explicitly set accessToken
      if (token.accessToken) {
        (session as any).accessToken = token.accessToken;
      }

      // Set user data
      if (token.user) {
        (session as any).user = token.user;
      } else {
        // Fallback: construct user from token properties
        (session as any).user = {
          id: token.id,
          email: token.email,
          name: token.name,
        };
      }

      return session;
    }
  },

  pages: {
    signIn: '/auth/login',
    error: '/auth/login',
  },

  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60, // 24 hours
  },

  secret: process.env.NEXTAUTH_SECRET || "your-secret-key-change-in-production",
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };


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
        if (!credentials?.email) {
          throw new Error("Missing email");
        }

        try {
          // Check if this is a 2FA verified token (bypass normal login)
          if ((credentials as any)['2fa_token']) {
            const token = (credentials as any)['2fa_token'];
            
            
            // Validate the token by calling the profile endpoint
            const validateResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1'}/auth/profile`, {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            });

            if (!validateResponse.ok) {
              console.error('❌ Token validation failed:', validateResponse.status);
              throw new Error('Invalid 2FA token');
            }

            const profileData = await validateResponse.json();
            
            if (profileData.success && profileData.data && profileData.data.user) {
              const userData = profileData.data.user;
              
              return {
                id: userData.id.toString(),
                email: userData.email,
                name: userData.name,
                image: userData.profile_image || userData.profile_picture,
                accessToken: token,
                user: userData
              };
            } else {
              console.error('❌ Profile data invalid:', profileData);
              throw new Error('Failed to get user profile with 2FA token');
            }
          }

          // Normal login flow
          if (!credentials?.password) {
            throw new Error("Missing password");
          }

          // Call your backend API
          const response = await authApi.login({
            email: credentials.email,
            password: credentials.password
          });

          // Check if 2FA is required
          if ((response as any).requiresTwoFactor && response.data?.tempToken) {
            throw new Error("2FA verification required");
          }

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
          
          // Extract error message from axios error response
          if (error.response?.data?.message) {
            throw new Error(error.response.data.message);
          } else if (error.response?.data) {
            throw new Error(error.response.data);
          } else {
            throw new Error(error.message || "Authentication failed");
          }
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
    signIn: `${process.env.NEXT_PUBLIC_BASE_PATH || ''}/auth/login`,
    error: `${process.env.NEXT_PUBLIC_BASE_PATH || ''}/auth/login`,
  },

  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60, // 24 hours
  },

  secret: process.env.NEXTAUTH_SECRET || "your-secret-key-change-in-production",
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };


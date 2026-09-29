// Edge-safe auth config (tanpa Prisma/bcryptjs — hanya untuk middleware)
import type { NextAuthConfig } from 'next-auth'

export default {
  providers: [], // Credentials provider didefinisikan di auth.ts (Node.js only)
  pages: {
    signIn: '/login',
    error: '/login',
  },
  callbacks: {
    authorized({ auth }) {
      // Izinkan akses jika sudah login
      return !!auth?.user
    },
  },
} satisfies NextAuthConfig

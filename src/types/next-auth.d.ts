import { UserRole } from "@/types/enums";

declare module "next-auth" {
  interface User {
    role: UserRole;
    id: string;
  }
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      role: UserRole;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: UserRole;
    id: string;
  }
}

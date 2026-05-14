import { prisma } from "../lib/prisma";
import { Prisma, User } from "@prisma/client";

export class UserRepository {
  async create(data: Prisma.UserCreateInput): Promise<User> {
    return prisma.user.create({ data });
  }

  async findByEmail(email: string): Promise<User | null> {
    return prisma.user.findFirst({ where: { email, deleted_at: null } });
  }

  async findById(id: string): Promise<User | null> {
    return prisma.user.findFirst({ where: { id, deleted_at: null } });
  }
}

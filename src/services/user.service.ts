import bcrypt from "bcryptjs";
import prisma from "../config/database";
import { RegisterDTO } from "../types";
import { User } from "@prisma/client";

class UserService {
  async createUser(data: RegisterDTO): Promise<Omit<User, "password">> {
    const hashedPassword = await bcrypt.hash(data.password, 10);

    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        password: hashedPassword
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        createdAt: true,
        updatedAt: true
      }
    });

    return user;
  }

  async findUserByEmail(email: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { email }
    });
  }

  async findUserById(id: string): Promise<Omit<User, "password"> | null> {
    return prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        createdAt: true,
        updatedAt: true
      }
    });
  }

  async validatePassword(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }

  // ---------------------------------------------------------
  // NOVAS FUNÇÕES PARA INTEGRAÇÃO COM WHATSAPP
  // ---------------------------------------------------------

  async findUserByPhone(phone: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { phone }
    });
  }

  async findOrCreateByPhone(phone: string): Promise<User> {
  if (!phone) {
    throw new Error("Phone number is required");
  }

  let user = await prisma.user.findUnique({
    where: { phone }
  });

  if (!user) {
    user = await prisma.user.create({
      data: {
        phone,
        name: `WhatsApp User ${phone}`,
        email: `${phone}@whatsapp.local`,
        password: await bcrypt.hash('whatsapp-temp', 10)
      }
    });
  }

  return user;
}

}

export default new UserService();

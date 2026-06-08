import { prisma } from "@quantrox/shared";

export const QRCodeService = {
  async getAll() {
    return prisma.qRCode.findMany({
      orderBy: { createdAt: 'desc' },
    });
  },

  async getActive() {
    return prisma.qRCode.findMany({
      where: { active: true },
      orderBy: { createdAt: 'desc' },
    });
  },

  async create(imageUrl: string) {
    return prisma.qRCode.create({
      data: {
        image: imageUrl,
        active: true,
      },
    });
  },

  async update(id: string, active: boolean) {
    return prisma.qRCode.update({
      where: { id },
      data: { active },
    });
  },

  async delete(id: string) {
    return prisma.qRCode.delete({
      where: { id },
    });
  }
};

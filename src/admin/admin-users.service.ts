import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import {
  UpdateUserStatusDto,
} from './dto/update-user-status.dto';

import {
  Prisma,
} from '../generated/prisma/client';

import {
  PrismaService,
} from '../prisma/prisma.service';

import {
  ListUsersQueryDto,
} from './dto/list-users-query.dto';

interface AdminAuditRequestInfo {
  ipAddress?: string | null;
  userAgent?: string | null;
}

@Injectable()
export class AdminUsersService {
  constructor(
    private readonly prisma:
      PrismaService,
  ) {}

  async findAll(
    query: ListUsersQueryDto,
  ) {
    const page =
      query.page || 1;

    const limit =
      query.limit || 20;

    const skip =
      (page - 1) * limit;

    const search =
      query.search
        ?.trim();

    const where:
      Prisma.UserWhereInput = {
        deletedAt: null,
      };

    if (search) {
      where.OR = [
        {
          email: {
            contains: search,
            mode: 'insensitive',
          },
        },

        {
          fullName: {
            contains: search,
            mode: 'insensitive',
          },
        },
      ];
    }

    const [
      users,
      total,
    ] =
      await this.prisma.$transaction([
        this.prisma.user.findMany({
          where,

          orderBy: {
            createdAt: 'desc',
          },

          skip,
          take: limit,

          select: {
            id: true,
            email: true,
            fullName: true,
            avatarUrl: true,
            role: true,
            status: true,
            emailVerifiedAt: true,
            lastLoginAt: true,
            createdAt: true,
            updatedAt: true,
          },
        }),

        this.prisma.user.count({
          where,
        }),
      ]);

    const totalPages =
      Math.max(
        1,
        Math.ceil(total / limit),
      );

    return {
      success: true,

      data: users.map(
        function (user) {
          return {
            id: user.id,
            email: user.email,

            name:
              user.fullName,

            fullName:
              user.fullName,

            avatar:
              user.avatarUrl ?? '',

            avatarUrl:
              user.avatarUrl,

            role:
              user.role,

            status:
              user.status,

            emailVerifiedAt:
              user.emailVerifiedAt,

            lastLoginAt:
              user.lastLoginAt,

            createdAt:
              user.createdAt,

            updatedAt:
              user.updatedAt,
          };
        },
      ),

      pagination: {
        page,
        limit,
        total,
        totalPages,

        hasPreviousPage:
          page > 1,

        hasNextPage:
          page < totalPages,
      },
    };
  }

async updateStatus(
  currentAdminId: string,
  targetUserId: string,
  dto: UpdateUserStatusDto,
  requestInfo: AdminAuditRequestInfo,
) {
  if (
    currentAdminId ===
    targetUserId
  ) {
    throw new BadRequestException(
      'Bạn không thể thay đổi trạng thái tài khoản của chính mình.',
    );
  }

  const targetUser =
    await this.prisma.user.findFirst({
      where: {
        id: targetUserId,
        deletedAt: null,
      },

      select: {
        id: true,
        email: true,
        fullName: true,
        avatarUrl: true,
        role: true,
        status: true,
        emailVerifiedAt: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

  if (!targetUser) {
    throw new NotFoundException(
      'Không tìm thấy tài khoản.',
    );
  }

  if (
    targetUser.status ===
    dto.status
  ) {
    return {
      success: true,

      message:
        dto.status === 'LOCKED'
          ? 'Tài khoản đã ở trạng thái khóa.'
          : 'Tài khoản đã ở trạng thái hoạt động.',

      user: this.toPublicUser(
        targetUser,
      ),
    };
  }

  /*
   * Không cho khóa quản trị viên
   * hoạt động cuối cùng.
   */
  if (
    targetUser.role === 'ADMIN' &&
    dto.status === 'LOCKED'
  ) {
    const activeAdminCount =
      await this.prisma.user.count({
        where: {
          role: 'ADMIN',
          status: 'ACTIVE',
          deletedAt: null,
        },
      });

    if (activeAdminCount <= 1) {
      throw new ConflictException(
        'Không thể khóa quản trị viên hoạt động cuối cùng.',
      );
    }
  }

  const changedAt =
    new Date();

const auditIpAddress =
  requestInfo.ipAddress
    ?.trim()
    .slice(0, 64) ||
  null;

const auditUserAgent =
  requestInfo.userAgent
    ?.trim()
    .slice(0, 2000) ||
  null;

  const updatedUser =
    await this.prisma.$transaction(
      async (transaction) => {
        const user =
          await transaction.user.update({
            where: {
              id: targetUser.id,
            },

            data: {
              status: dto.status,

              /*
               * Mọi JWT cũ đều mất hiệu lực
               * ngay sau khi trạng thái đổi.
               */
              tokenVersion: {
                increment: 1,
              },
            },

            select: {
              id: true,
              email: true,
              fullName: true,
              avatarUrl: true,
              role: true,
              status: true,
              emailVerifiedAt: true,
              lastLoginAt: true,
              createdAt: true,
              updatedAt: true,
            },
          });

        /*
         * Khi khóa, thu hồi toàn bộ
         * refresh session còn hoạt động.
         */
        if (
          dto.status === 'LOCKED'
        ) {
          await transaction
            .refreshSession
            .updateMany({
              where: {
                userId:
                  targetUser.id,

                revokedAt: null,
              },

              data: {
                revokedAt:
                  changedAt,
              },
            });
        }
await transaction.auditLog.create({
  data: {
    actorUserId:
      currentAdminId,

    action:
      dto.status === 'LOCKED'
        ? 'LOCK_USER'
        : 'UNLOCK_USER',

    entityType:
      'USER',

    entityId:
      targetUser.id,

    oldData: {
      email:
        targetUser.email,

      role:
        targetUser.role,

      status:
        targetUser.status,
    },

    newData: {
      email:
        user.email,

      role:
        user.role,

      status:
        user.status,
    },

    ipAddress:
      auditIpAddress,

    userAgent:
      auditUserAgent,
  },
});

        return user;
      },
    );

  return {
    success: true,

    message:
      dto.status === 'LOCKED'
        ? 'Khóa tài khoản thành công.'
        : 'Mở khóa tài khoản thành công.',

    user: this.toPublicUser(
      updatedUser,
    ),
  };
}

private toPublicUser(
  user: {
    id: string;
    email: string;
    fullName: string;
    avatarUrl: string | null;
    role: string;
    status: string;
    emailVerifiedAt: Date | null;
    lastLoginAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
  },
) {
  return {
    id: user.id,
    email: user.email,

    name:
      user.fullName,

    fullName:
      user.fullName,

    avatar:
      user.avatarUrl ?? '',

    avatarUrl:
      user.avatarUrl,

    role:
      user.role,

    status:
      user.status,

    emailVerifiedAt:
      user.emailVerifiedAt,

    lastLoginAt:
      user.lastLoginAt,

    createdAt:
      user.createdAt,

    updatedAt:
      user.updatedAt,
  };
}

}
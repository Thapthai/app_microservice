import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaClient as ArchivePrismaClient } from '@prisma/archive-client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  async onModuleInit() {
    await this.$connect();
  }
}

@Injectable()
export class ArchivePrismaService
  extends ArchivePrismaClient
  implements OnModuleInit
{
  async onModuleInit() {
    await this.$connect();
  }
}


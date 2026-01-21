import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { UserRepository } from './repositories/user.repository';
import { UserValidator } from './validators/user.validator';
import { UserFactory } from './factories/user.factory';
import { CompaniesModule } from 'src/modules/companies/companies.module';

//  Services específicos
import {
  UserPermissionService,
  SystemAdminService,
  AdminService,
  UserQueryService,
} from './services';

@Module({
  controllers: [UsersController],
  providers: [
    UsersService,
    UserRepository,
    UserValidator,
    UserQueryService,
    UserPermissionService,
    UserFactory,
    SystemAdminService,
    AdminService,
  ],
  imports: [CompaniesModule],
  exports: [
    UsersService,
    UserRepository,
    UserValidator,
    UserQueryService,
    UserPermissionService,
    UserFactory,
  ],
})
export class UsersModule {}

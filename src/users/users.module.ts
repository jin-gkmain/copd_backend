import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';
import { UserSchemaService } from './user-schema.service';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  providers: [UsersService, UserSchemaService],
  exports: [UsersService],
})
export class UsersModule {}

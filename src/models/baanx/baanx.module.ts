import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { UserModule } from '../user/user.module';
import { UserController } from './controllers/baanx-user.controller';
import { BaanxUserService } from './services/baanx-user.service';
import { MongooseModule } from '@nestjs/mongoose';
import { BaanxUser, BaanxUserSchema } from './schemas/baanx-user.schema';
import { BaanxUserRepository } from './repositories/baanx-user.repository';

@Module({
  controllers: [UserController],
  providers: [BaanxUserService, BaanxUserRepository],
  imports: [
    HttpModule.register({
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
    }),
    MongooseModule.forFeature([
      { name: BaanxUser.name, schema: BaanxUserSchema },
    ]),
    UserModule,
  ],
})
export class BaanxModule {}

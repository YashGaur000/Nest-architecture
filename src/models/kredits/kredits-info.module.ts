import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { KreditsInfoSchema,KreditsInfo } from './schemas/kredits.schema';
import { KreditsInfoLogSchema,KreditsInfoLog } from './schemas/kredits_logs.schema';
import { KreditsInfoService } from './kredits-info.service';
import { KreditsInfoController } from './kredits-info.controller';
import { UserModule } from '../user/user.module';

@Module({
  imports: [
    UserModule,
    MongooseModule.forFeature([
      { name: KreditsInfo.name, schema: KreditsInfoSchema },
      { name: KreditsInfoLog.name, schema: KreditsInfoLogSchema },
    ]),
  ],
  controllers: [KreditsInfoController],
  providers: [KreditsInfoService],
})
export class KreditsInfoModule {}

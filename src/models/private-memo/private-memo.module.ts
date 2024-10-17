import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PrivetMemo, PrivateMemoSchema } from './schemas/private-memo.schema';
import { PrivateMemoService } from './private-memo.service';
import { PrivateMemoController } from './private-memo.controller';
import { UserModule } from '../user/user.module';

@Module({
  imports: [
    UserModule,
    MongooseModule.forFeature([
      { name: PrivetMemo.name, schema: PrivateMemoSchema },
    ]),
  ],
  controllers: [PrivateMemoController],
  providers: [PrivateMemoService],
})
export class PrivateMemoModule {}

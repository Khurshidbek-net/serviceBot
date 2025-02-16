import { Module } from '@nestjs/common';
import { BotService } from './bot.service';
import { SequelizeModule } from '@nestjs/sequelize';
import { Servant } from './models/servant.model';
import { BotUpdate } from './bot.update';
import { Customer } from './models/customer.model';
import { CustomerServiceQueue } from './models/customerServiceQueue.model';
import { ServantTimeTable } from './models/servantTimeTable.model';

@Module({
  imports: [SequelizeModule.forFeature([Servant, Customer, CustomerServiceQueue, ServantTimeTable])],
  providers: [BotUpdate, BotService],
  exports: [BotService]
})
export class BotModule {}

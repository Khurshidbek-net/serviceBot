import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SequelizeModule } from '@nestjs/sequelize';
import { BotModule } from './bot/bot.module';
import { Servant } from './bot/models/servant.model';
import { TelegrafModule } from 'nestjs-telegraf';
import { BOT_NAME } from './app.consts';
import { Customer } from './bot/models/customer.model';

@Module({
  imports: [ConfigModule.forRoot({ envFilePath: ".env", isGlobal: true }),

    TelegrafModule.forRootAsync({
      botName: BOT_NAME,
      useFactory: () => ({
        token: process.env.BOT_TOKEN || "undefined",
        middlewares: [],
        include: [BotModule],
      })
    }),

    SequelizeModule.forRoot({
      dialect: "postgres",
      host: process.env.POSTGRES_HOST,
      username: process.env.POSTGRES_USER,
      port: Number(process.env.POSTGRES_PORT),
      password: process.env.POSTGRES_PASSWORD,
      database: process.env.POSTGRES_DB,
      models: [Servant, Customer],
      autoLoadModels: true,
      sync: { alter: true },
      logging: false  
    }),
    BotModule
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}

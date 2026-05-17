import { MailerModule } from '@nestjs-modules/mailer';
import { Module } from '@nestjs/common';
import { MailService } from './mail.service';
import { MailController } from './mail.controller';
import { ConfigService } from '@nestjs/config';


// // ✅ DEBUG LOGS (runs immediately when file is loaded)
// console.log('📧 MAIL CONFIG DEBUG START');
// console.log('MAIL_HOST:', process.env.MAIL_HOST);
// console.log('MAIL_PORT:', process.env.MAIL_PORT);
// console.log('MAIL_USER:', process.env.MAIL_USER);
// console.log('MAIL_PASS:', process.env.MAIL_PASS ? '✅ EXISTS' : '❌ MISSING');
// console.log('MAIL_FROM:', process.env.MAIL_FROM);
// console.log('📧 MAIL CONFIG DEBUG END');

@Module({
  // imports: [
  //   MailerModule.forRoot({
  //     transport: {
  //       host: process.env.MAIL_HOST,
  //       port: Number(process.env.MAIL_PORT),
  //       secure: false,
  //       auth: {
  //         user: process.env.MAIL_USER,
  //         pass: process.env.MAIL_PASS,
  //       },
  //     },
  //     defaults: {
  //       from: process.env.MAIL_FROM,
  //     },
  //   }),
  // ],
  imports: [
    MailerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        transport: {
          host: config.get<string>('MAIL_HOST'),
          port: Number(config.get<string>('MAIL_PORT')),
          secure: false,
          auth: {
            user: config.get<string>('MAIL_USER'),
            pass: config.get<string>('MAIL_PASS'),
          },
        },
        defaults: {
          from: config.get<string>('MAIL_FROM'),
        },
      }),
    }),
  ],
  providers: [MailService],
  exports: [MailerModule, MailService],
  controllers: [MailController],
})
export class MailModule {}
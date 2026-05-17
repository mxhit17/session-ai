import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class MailService {
  constructor(private readonly mailerService: MailerService) {}

  async sendSessionCreatedEmail(to: string, session: any) {
    await this.mailerService.sendMail({
      to,
      subject: '🎉 Session Created Successfully',
      html: this.getSessionTemplate(session),
    });
  }

  private getSessionTemplate(session: any): string {
    return `
      <div style="font-family: Arial; padding: 20px;">
        <h2>🎉 Your session is live!</h2>

        <p>Your session has been successfully created on <b>Session AI</b>.</p>

        <div style="margin-top: 15px;">
          <p><strong>Title:</strong> ${session.title}</p>
          <p><strong>Date:</strong> ${session.date}</p>
        </div>

        <br/>

        <p>We’re excited to have you onboard 🚀</p>

        <br/>
        <hr/>

        <p style="font-size: 12px; color: gray;">
          This is an automated email. Please do not reply.
        </p>
      </div>
    `;
  }

  async sendTestEmail() {
    try {
      const info = await this.mailerService.sendMail({
        to: 'mmudgal67@gmail.com', // 👈 replace with your email
        subject: 'Test Email 🚀',
        html: `
          <div style="font-family: Arial; padding: 20px;">
            <h1>✅ It works!</h1>
            <p>Gmail SMTP is working correctly.</p>
          </div>
        `,
      });

      console.log('✅ Email sent:', info);
      return info;
    } catch (error) {
      console.error('❌ Error sending email:', error);
      throw error;
    }
  }

  async sendSessionAcceptedEmail(to: string, session: any) {
    await this.mailerService.sendMail({
      to,
      subject: '✅ Your session has been approved!',
      html: this.getAcceptedTemplate(session),
    });
  }

  async sendSessionRejectedEmail(to: string, session: any) {
    await this.mailerService.sendMail({
      to,
      subject: '❌ Your session was not approved',
      html: this.getRejectedTemplate(session),
    });
  }
  private getAcceptedTemplate(session: any): string {
    return `
      <div style="font-family: Arial; max-width: 600px; margin: auto; padding: 20px;">
        <h2 style="color: green;">🎉 Session Approved!</h2>

        <p>Great news! Your session has been approved.</p>

        <div style="background: #f6f6f6; padding: 15px; border-radius: 8px;">
          <p><strong>Title:</strong> ${session.title}</p>
          <p><strong>Date:</strong> ${session.date}</p>
        </div>

        <br/>

        <p>We’re excited to have your session live 🚀</p>

        <hr/>
        <p style="font-size: 12px; color: gray;">
          This is an automated email. Please do not reply.
        </p>
      </div>
    `;
  }
  private getRejectedTemplate(session: any): string {
    return `
      <div style="font-family: Arial; max-width: 600px; margin: auto; padding: 20px;">
        <h2 style="color: red;">❌ Session Not Approved</h2>

        <p>We’re sorry to inform you that your session was not approved.</p>

        <div style="background: #f6f6f6; padding: 15px; border-radius: 8px;">
          <p><strong>Title:</strong> ${session.title}</p>
        </div>

        <br/>

        <p>You can update and resubmit your session anytime.</p>

        <hr/>
        <p style="font-size: 12px; color: gray;">
          This is an automated email. Please do not reply.
        </p>
      </div>
    `;
  }

  async sendEventCreatedEmail(to: string, event: any) {
  await this.mailerService.sendMail({
    to,
    subject: '🎉 Event Created Successfully',
    html: this.getEventTemplate(event),
  });
}

private getEventTemplate(event: any): string {
  return `
    <div style="font-family: Arial; max-width: 600px; margin: auto; padding: 20px;">
      <h2>🎉 Your event is live!</h2>

      <p>Your event has been successfully created on <b>Session AI</b>.</p>

      <div style="background: #f6f6f6; padding: 15px; border-radius: 8px;">
        <p><strong>Title:</strong> ${event.title}</p>
        <p><strong>Location:</strong> ${event.location}</p>
        <p><strong>Start:</strong> ${event.start_date}</p>
        <p><strong>End:</strong> ${event.end_date}</p>
      </div>

      <br/>

      <p>We’re excited to have your event onboard 🚀</p>

      <hr/>
      <p style="font-size: 12px; color: gray;">
        This is an automated email. Please do not reply.
      </p>
    </div>
  `;
}
}
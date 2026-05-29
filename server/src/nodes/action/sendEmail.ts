import nodemailer from 'nodemailer';
import { NodeExecutor, NodeExecuteResult, NodeExecutionContext } from '../registry';
import { parseTemplate } from '../../utils/templateParser';

let transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.ethereal.email',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: parseInt(process.env.SMTP_PORT || '587') === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }
  return transporter;
}

export const executeSendEmail: NodeExecutor = async (
  config: any,
  context: NodeExecutionContext
): Promise<NodeExecuteResult> => {
  try {
    const to = parseTemplate(config.to || '', context.variables);
    const subject = parseTemplate(config.subject || 'NexFlow Notification', context.variables);
    const html = parseTemplate(config.body || config.html || '', context.variables);
    const cc = config.cc ? parseTemplate(config.cc, context.variables) : undefined;
    const bcc = config.bcc ? parseTemplate(config.bcc, context.variables) : undefined;

    if (!to) {
      return { success: false, output: null, error: 'Recipient (to) is required' };
    }

    const transport = getTransporter();
    const info = await transport.sendMail({
      from: process.env.EMAIL_FROM || 'noreply@nexflow.com',
      to,
      cc,
      bcc,
      subject,
      html,
    });

    return {
      success: true,
      output: {
        messageId: info.messageId,
        accepted: info.accepted,
        rejected: info.rejected,
        to,
        subject,
      },
    };
  } catch (error: any) {
    return {
      success: false,
      output: null,
      error: `Email send failed: ${error.message}`,
    };
  }
};

import nodemailer from 'nodemailer';
import path from 'path';

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: Number(process.env.EMAIL_PORT),
  secure: process.env.EMAIL_SECURE === 'true',
  auth: {
    user: process.env.SMTP_EMAIL,
    pass: process.env.SMTP_PASSWORD,
  },
});

export const sendVerificationEmail = async (to: string, code: string) => {
  const logoPath = path.join(process.cwd(), 'assets', 'logo.png');
  
  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to,
    subject: 'Mono - Email Verification',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { margin: 0; padding: 0; background-color: #f4f7ff; }
          .container { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; }
          .card { background-color: #ffffff; border-radius: 24px; padding: 48px; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.05), 0 10px 10px -5px rgba(0, 0, 0, 0.02); text-align: center; border: 1px solid #eef2ff; }
          .logo { width: 80px; height: 80px; margin-bottom: 32px; border-radius: 20px; }
          .title { font-size: 28px; font-weight: 800; color: #1e293b; margin-bottom: 12px; letter-spacing: -0.02em; }
          .subtitle { font-size: 16px; color: #64748b; margin-bottom: 40px; line-height: 1.6; }
          .code-box { background: linear-gradient(135deg, #f8faff 0%, #f0f4ff 100%); border-radius: 20px; padding: 32px; margin: 32px 0; border: 1px solid #e0e7ff; }
          .code { font-size: 42px; font-weight: 900; letter-spacing: 12px; color: #4361ee; font-family: 'SF Mono', 'Fira Code', 'Roboto Mono', monospace; text-shadow: 0 2px 4px rgba(67, 97, 238, 0.1); }
          .footer-text { font-size: 14px; color: #94a3b8; line-height: 1.6; margin-top: 40px; }
          .divider { height: 1px; background: linear-gradient(to right, transparent, #e2e8f0, transparent); margin: 40px 0; }
          .company-footer { font-size: 12px; color: #cbd5e1; font-weight: 500; text-transform: uppercase; letter-spacing: 0.1em; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="card">
            <img src="cid:monologo" alt="Mono" class="logo" />
            <h1 class="title">Confirm your email</h1>
            <p class="subtitle">Welcome to the future of finance. Use the secure code below to verify your account and get started.</p>
            <div class="code-box"><div class="code">${code}</div></div>
            <p class="footer-text">This code will remain active for the next 10 minutes.<br/>If you didn't create an account, you can safely ignore this.</p>
            <div class="divider"></div>
            <div class="company-footer">&copy; ${new Date().getFullYear()} Mono Finance &bull; Premium Banking Experience</div>
          </div>
        </div>
      </body>
      </html>
    `,
    attachments: [{ filename: 'logo.png', path: logoPath, cid: 'monologo' }]
  };

  try {
    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error('Error sending verification email:', error);
    throw new Error('Failed to send verification email');
  }
};

export const sendPasswordChangeEmail = async (to: string, code: string) => {
  const logoPath = path.join(process.cwd(), 'assets', 'logo.png');
  
  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to,
    subject: 'Mono - Password Change Verification',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { margin: 0; padding: 0; background-color: #f4f7ff; }
          .container { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; }
          .card { background-color: #ffffff; border-radius: 24px; padding: 48px; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.05), 0 10px 10px -5px rgba(0, 0, 0, 0.02); text-align: center; border: 1px solid #eef2ff; }
          .logo { width: 80px; height: 80px; margin-bottom: 32px; border-radius: 20px; }
          .title { font-size: 28px; font-weight: 800; color: #1e293b; margin-bottom: 12px; letter-spacing: -0.02em; }
          .subtitle { font-size: 16px; color: #64748b; margin-bottom: 40px; line-height: 1.6; }
          .code-box { background: linear-gradient(135deg, #f8faff 0%, #f0f4ff 100%); border-radius: 20px; padding: 32px; margin: 32px 0; border: 1px solid #e0e7ff; }
          .code { font-size: 42px; font-weight: 900; letter-spacing: 12px; color: #4361ee; font-family: 'SF Mono', 'Fira Code', 'Roboto Mono', monospace; text-shadow: 0 2px 4px rgba(67, 97, 238, 0.1); }
          .footer-text { font-size: 14px; color: #94a3b8; line-height: 1.6; margin-top: 40px; }
          .divider { height: 1px; background: linear-gradient(to right, transparent, #e2e8f0, transparent); margin: 40px 0; }
          .company-footer { font-size: 12px; color: #cbd5e1; font-weight: 500; text-transform: uppercase; letter-spacing: 0.1em; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="card">
            <img src="cid:monologo" alt="Mono" class="logo" />
            <h1 class="title">Security Alert</h1>
            <p class="subtitle">A password change was requested for your Mono account. Use the secure code below to confirm this change.</p>
            <div class="code-box"><div class="code">${code}</div></div>
            <p class="footer-text">This code will expire in 10 minutes.<br/>If you didn't request this change, please contact support immediately.</p>
            <div class="divider"></div>
            <div class="company-footer">&copy; ${new Date().getFullYear()} Mono Finance &bull; Premium Banking Experience</div>
          </div>
        </div>
      </body>
      </html>
    `,
    attachments: [{ filename: 'logo.png', path: logoPath, cid: 'monologo' }]
  };

  try {
    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error('Error sending password change email:', error);
    throw new Error('Failed to send password change email');
  }
};

export const sendDeleteRequestEmail = async (to: string, code: string) => {
  const logoPath = path.join(process.cwd(), 'assets', 'logo.png');
  // ... common setup ...
  
  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to,
    subject: 'Mono - Bestätigungscode zur Kündigung',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { margin: 0; padding: 0; background-color: #f4f7ff; }
          .container { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; }
          .card { background-color: #ffffff; border-radius: 24px; padding: 48px; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.05), 0 10px 10px -5px rgba(0, 0, 0, 0.02); text-align: center; border: 1px solid #eef2ff; }
          .logo { width: 80px; height: 80px; margin-bottom: 32px; border-radius: 20px; }
          .title { font-size: 28px; font-weight: 800; color: #1e293b; margin-bottom: 12px; letter-spacing: -0.02em; }
          .subtitle { font-size: 16px; color: #64748b; margin-bottom: 40px; line-height: 1.6; }
          .code-box { background: linear-gradient(135deg, #f8faff 0%, #f0f4ff 100%); border-radius: 20px; padding: 32px; margin: 32px 0; border: 1px solid #e0e7ff; }
          .code { font-size: 42px; font-weight: 900; letter-spacing: 12px; color: #dc2626; font-family: 'SF Mono', 'Fira Code', 'Roboto Mono', monospace; text-shadow: 0 2px 4px rgba(220, 38, 38, 0.1); }
          .footer-text { font-size: 14px; color: #94a3b8; line-height: 1.6; margin-top: 40px; }
          .divider { height: 1px; background: linear-gradient(to right, transparent, #e2e8f0, transparent); margin: 40px 0; }
          .company-footer { font-size: 12px; color: #cbd5e1; font-weight: 500; text-transform: uppercase; letter-spacing: 0.1em; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="card">
            <img src="cid:monologo" alt="Mono" class="logo" />
            <h1 class="title">Ihre Kündigungsanfrage</h1>
            <p class="subtitle">Wir haben Ihre Anfrage zur Kündigung erhalten. Bitte verwenden Sie den folgenden Code, um die Kündigung zu bestätigen:</p>
            <div class="code-box"><div class="code">${code}</div></div>
            <p class="footer-text">Dieser Code ist 10 Minuten gültig.<br/>Wenn Sie diese Anfrage nicht gestellt haben, kontaktieren Sie uns bitte sofort.</p>
            <div class="divider"></div>
            <div class="company-footer">&copy; ${new Date().getFullYear()} Mono Finance &bull; Premium Banking Experience</div>
          </div>
        </div>
      </body>
      </html>
    `,
    attachments: [{ filename: 'logo.png', path: logoPath, cid: 'monologo' }]
  };

  await transporter.sendMail(mailOptions);
};

export const sendDeleteConfirmEmail = async (to: string) => {
  const logoPath = path.join(process.cwd(), 'assets', 'logo.png');
  
  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to,
    subject: 'Mono - Kündigungsbestätigung',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { margin: 0; padding: 0; background-color: #f4f7ff; }
          .container { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; }
          .card { background-color: #ffffff; border-radius: 24px; padding: 48px; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.05), 0 10px 10px -5px rgba(0, 0, 0, 0.02); text-align: center; border: 1px solid #eef2ff; }
          .logo { width: 80px; height: 80px; margin-bottom: 32px; border-radius: 20px; }
          .title { font-size: 28px; font-weight: 800; color: #1e293b; margin-bottom: 12px; letter-spacing: -0.02em; }
          .subtitle { font-size: 16px; color: #64748b; margin-bottom: 40px; line-height: 1.6; }
          .footer-text { font-size: 14px; color: #94a3b8; line-height: 1.6; margin-top: 40px; }
          .divider { height: 1px; background: linear-gradient(to right, transparent, #e2e8f0, transparent); margin: 40px 0; }
          .company-footer { font-size: 12px; color: #cbd5e1; font-weight: 500; text-transform: uppercase; letter-spacing: 0.1em; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="card">
            <img src="cid:monologo" alt="Mono" class="logo" />
            <h1 class="title">Kündigung erhalten</h1>
            <p class="subtitle">Wir haben Ihre Kündigung erhalten. Sie können Ihr Konto noch <b>30 Tage</b> lang nutzen.</p>
            <p class="subtitle">Wenn Sie Ihre Meinung ändern, können Sie die Löschung in den Einstellungen jederzeit widerrufen.</p>
            <div class="divider"></div>
            <div class="company-footer">&copy; ${new Date().getFullYear()} Mono Finance &bull; Premium Banking Experience</div>
          </div>
        </div>
      </body>
      </html>
    `,
    attachments: [{ filename: 'logo.png', path: logoPath, cid: 'monologo' }]
  };

  await transporter.sendMail(mailOptions);
};

export const sendUndoDeleteEmail = async (to: string, code: string) => {
  const logoPath = path.join(process.cwd(), 'assets', 'logo.png');
  
  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to,
    subject: 'Mono - Kündigung widerrufen',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { margin: 0; padding: 0; background-color: #f4f7ff; }
          .container { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; }
          .card { background-color: #ffffff; border-radius: 24px; padding: 48px; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.05), 0 10px 10px -5px rgba(0, 0, 0, 0.02); text-align: center; border: 1px solid #eef2ff; }
          .logo { width: 80px; height: 80px; margin-bottom: 32px; border-radius: 20px; }
          .title { font-size: 28px; font-weight: 800; color: #1e293b; margin-bottom: 12px; letter-spacing: -0.02em; }
          .subtitle { font-size: 16px; color: #64748b; margin-bottom: 40px; line-height: 1.6; }
          .code-box { background: linear-gradient(135deg, #f8faff 0%, #f0f4ff 100%); border-radius: 20px; padding: 32px; margin: 32px 0; border: 1px solid #e0e7ff; }
          .code { font-size: 42px; font-weight: 900; letter-spacing: 12px; color: #10b981; font-family: 'SF Mono', 'Fira Code', 'Roboto Mono', monospace; text-shadow: 0 2px 4px rgba(16, 185, 129, 0.1); }
          .footer-text { font-size: 14px; color: #94a3b8; line-height: 1.6; margin-top: 40px; }
          .divider { height: 1px; background: linear-gradient(to right, transparent, #e2e8f0, transparent); margin: 40px 0; }
          .company-footer { font-size: 12px; color: #cbd5e1; font-weight: 500; text-transform: uppercase; letter-spacing: 0.1em; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="card">
            <img src="cid:monologo" alt="Mono" class="logo" />
            <h1 class="title">Kündigung widerrufen</h1>
            <p class="subtitle">Bitte geben Sie folgenden Code ein, um die Kündigung Ihres Kontos zu stornieren:</p>
            <div class="code-box"><div class="code">${code}</div></div>
            <p class="footer-text">Dieser Code ist 10 Minuten gültig.</p>
            <div class="divider"></div>
            <div class="company-footer">&copy; ${new Date().getFullYear()} Mono Finance &bull; Premium Banking Experience</div>
          </div>
        </div>
      </body>
      </html>
    `,
    attachments: [{ filename: 'logo.png', path: logoPath, cid: 'monologo' }]
  };

  await transporter.sendMail(mailOptions);
};

export const sendUndoConfirmEmail = async (to: string) => {
  const logoPath = path.join(process.cwd(), 'assets', 'logo.png');
  
  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to,
    subject: 'Mono - Kündigung storniert',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { margin: 0; padding: 0; background-color: #f4f7ff; }
          .container { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; }
          .card { background-color: #ffffff; border-radius: 24px; padding: 48px; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.05), 0 10px 10px -5px rgba(0, 0, 0, 0.02); text-align: center; border: 1px solid #eef2ff; }
          .logo { width: 80px; height: 80px; margin-bottom: 32px; border-radius: 20px; }
          .title { font-size: 28px; font-weight: 800; color: #1e293b; margin-bottom: 12px; letter-spacing: -0.02em; }
          .subtitle { font-size: 16px; color: #64748b; margin-bottom: 40px; line-height: 1.6; }
          .footer-text { font-size: 14px; color: #94a3b8; line-height: 1.6; margin-top: 40px; }
          .divider { height: 1px; background: linear-gradient(to right, transparent, #e2e8f0, transparent); margin: 40px 0; }
          .company-footer { font-size: 12px; color: #cbd5e1; font-weight: 500; text-transform: uppercase; letter-spacing: 0.1em; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="card">
            <img src="cid:monologo" alt="Mono" class="logo" />
            <h1 class="title">Willkommen zurück!</h1>
            <p class="subtitle">Wir haben Ihren Antrag auf Kündigung storniert. Wir freuen uns, dass Sie weiterhin bei uns sind.</p>
            <div class="divider"></div>
            <div class="company-footer">&copy; ${new Date().getFullYear()} Mono Finance &bull; Premium Banking Experience</div>
          </div>
        </div>
      </body>
      </html>
    `,
    attachments: [{ filename: 'logo.png', path: logoPath, cid: 'monologo' }]
  };

  await transporter.sendMail(mailOptions);
};

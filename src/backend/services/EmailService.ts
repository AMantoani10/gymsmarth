import nodemailer from 'nodemailer';

// Valores de placeholder que indicam configuração incompleta
const EMAIL_PLACEHOLDERS = [
  'seu_email_aqui@gmail.com',
  'seu-email@gmail.com',
  'o_codigo_de_16_letras_gerado',
  'sua-senha-de-app',
  '',
];

function isEmailConfigured(): boolean {
  const user = process.env.EMAIL_USER || '';
  const pass = process.env.EMAIL_PASS || '';
  return (
    !!user &&
    !!pass &&
    !EMAIL_PLACEHOLDERS.includes(user) &&
    !EMAIL_PLACEHOLDERS.includes(pass)
  );
}

let transporter: any = null;

function getTransporter() {
  if (!transporter) {
    const user = process.env.EMAIL_USER || '';
    const pass = process.env.EMAIL_PASS || '';
    
    // Log de diagnóstico (mascara a senha)
    const maskedPass = pass.length > 4 
      ? pass.substring(0, 4) + '*'.repeat(pass.length - 4) 
      : '****';
    console.log(`[EmailService] Criando transporter com: user="${user}", pass="${maskedPass}" (${pass.length} caracteres)`);
    
    transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: {
        user: user,
        pass: pass,
      },
    });
  }
  return transporter;
}

/**
 * Verifica se as credenciais de e-mail estão funcionando.
 * Chamado na inicialização do servidor.
 */
export async function verifyEmailConnection(): Promise<void> {
  if (!isEmailConfigured()) {
    console.warn('[EmailService] ⚠️  E-mail NÃO configurado. Verifique EMAIL_USER e EMAIL_PASS no .env.');
    return;
  }
  
  try {
    await getTransporter().verify();
    console.log('[EmailService] ✅ Conexão com Gmail verificada com sucesso!');
  } catch (error: any) {
    console.error('[EmailService] ❌ Falha ao conectar no Gmail:', error.message);
    console.error('[EmailService] 💡 Dicas:');
    console.error('   1. Verifique se a Verificação em 2 etapas está ATIVADA na conta Google');
    console.error('   2. Gere uma nova Senha de App em: https://myaccount.google.com/apppasswords');
    console.error('   3. Cole a senha COM os espaços (ex: "abcd efgh ijkl mnop")');
    console.error('   4. Verifique se o e-mail no .env está correto');
    // Reseta o transporter para tentar novamente na próxima vez
    transporter = null;
  }
}

export class EmailService {
  /**
   * Envia um e-mail de boas-vindas quando a conta é criada.
   */
  async sendWelcomeEmail(to: string, nome: string) {
    if (!isEmailConfigured()) {
      console.warn('[EmailService] ⚠️  E-mail NÃO configurado. Verifique EMAIL_USER e EMAIL_PASS no .env (não use os valores de placeholder). E-mail de boas-vindas não enviado.');
      return;
    }

    const mailOptions = {
      from: `"Gym Smarth" <${process.env.EMAIL_USER}>`,
      to,
      subject: 'Bem-vindo ao Gym Smarth!',
      html: `
        <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: auto; border: 1px solid #ddd; border-radius: 8px; overflow: hidden;">
          <div style="background-color: #FF8C00; padding: 20px; text-align: center;">
            <h1 style="color: #fff; margin: 0;">GYM SMARTH</h1>
          </div>
          <div style="padding: 20px;">
            <p>Olá <strong>${nome}</strong>,</p>
            <p>Sua conta foi criada com sucesso no <strong>Gym Smarth</strong>!</p>
            <p>Você já pode acessar o aplicativo e aproveitar todos os nossos recursos.</p>
            <br/>
            <p>Abraços,<br/>Equipe Gym Smarth</p>
          </div>
        </div>
      `,
    };

    try {
      await getTransporter().sendMail(mailOptions);
      console.log(`[EmailService] E-mail de boas-vindas enviado para ${to}`);
    } catch (error) {
      console.error(`[EmailService] Erro ao enviar e-mail de boas-vindas para ${to}:`, error);
    }
  }

  /**
   * Envia um e-mail com o código de recuperação de senha.
   */
  async sendPasswordRecoveryEmail(to: string, code: string) {
    if (!isEmailConfigured()) {
      console.warn('[EmailService] ⚠️  E-mail NÃO configurado. Verifique EMAIL_USER e EMAIL_PASS no .env (não use os valores de placeholder). Código de recuperação não enviado.');
      throw new Error('Serviço de e-mail não configurado. Entre em contato com o administrador do sistema.');
    }

    const mailOptions = {
      from: `"Gym Smarth" <${process.env.EMAIL_USER}>`,
      to,
      subject: 'Recuperação de Senha - Gym Smarth',
      html: `
        <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: auto; border: 1px solid #ddd; border-radius: 8px; overflow: hidden;">
          <div style="background-color: #FF8C00; padding: 20px; text-align: center;">
            <h1 style="color: #fff; margin: 0;">GYM SMARTH</h1>
          </div>
          <div style="padding: 20px;">
            <p>Você solicitou a recuperação de senha da sua conta.</p>
            <p>Utilize o código abaixo no aplicativo para definir uma nova senha:</p>
            <div style="text-align: center; margin: 30px 0;">
              <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; background-color: #f4f4f4; padding: 15px 30px; border-radius: 8px;">${code}</span>
            </div>
            <p style="color: #888; font-size: 12px;">Este código expira em 15 minutos.</p>
            <p style="color: #888; font-size: 12px;">Se você não solicitou a alteração, ignore este e-mail.</p>
          </div>
        </div>
      `,
    };

    try {
      await getTransporter().sendMail(mailOptions);
      console.log(`[EmailService] E-mail de recuperação enviado para ${to}`);
    } catch (error) {
      console.error(`[EmailService] Erro ao enviar e-mail de recuperação para ${to}:`, error);
      throw new Error('Falha ao enviar e-mail de recuperação. Tente novamente mais tarde.');
    }
  }
}

import { welcomeTemplate } from './welcome.template';
import { emailVerificationTemplate } from './email-verification.template';
import { passwordResetTemplate } from './password-reset.template';
import { emailOTPTemplate } from './email-otp.template';
import { EmailTemplate } from '../dto/email.dto';

export const emailTemplates = {
  [EmailTemplate.WELCOME]: welcomeTemplate,
  [EmailTemplate.EMAIL_VERIFICATION]: emailVerificationTemplate,
  [EmailTemplate.PASSWORD_RESET]: passwordResetTemplate,
  [EmailTemplate.EMAIL_OTP]: emailOTPTemplate,
  [EmailTemplate.LOGIN_NOTIFICATION]: {
    subject: 'การเข้าสู่ระบบใหม่ - {{appName}}',
    text: `
สวัสดี {{name}},

มีการเข้าสู่ระบบบัญชีของคุณ:
- เวลา: {{loginTime}}
- อุปกรณ์: {{device}}
- IP Address: {{ipAddress}}
- ตำแหน่ง: {{location}}

หากไม่ใช่คุณ กรุณาเปลี่ยนรหัสผ่านทันที

ทีม {{appName}}
    `,
    html: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>การเข้าสู่ระบบใหม่</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #4CAF50; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9f9f9; }
        .info-box { background: white; padding: 15px; border-radius: 4px; margin: 15px 0; }
        .warning { background: #ffebee; border: 1px solid #f8bbd9; padding: 15px; border-radius: 4px; margin: 15px 0; }
        .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🔐 การเข้าสู่ระบบใหม่</h1>
        </div>
        
        <div class="content">
            <h2>สวัสดี {{name}}!</h2>
            
            <p>มีการเข้าสู่ระบบบัญชีของคุณเมื่อสักครู่</p>
            
            <div class="info-box">
                <h3>รายละเอียดการเข้าสู่ระบบ:</h3>
                <ul>
                    <li><strong>เวลา:</strong> {{loginTime}}</li>
                    <li><strong>อุปกรณ์:</strong> {{device}}</li>
                    <li><strong>IP Address:</strong> {{ipAddress}}</li>
                    <li><strong>ตำแหน่ง:</strong> {{location}}</li>
                </ul>
            </div>
            
            <div class="warning">
                <p><strong>⚠️ หากไม่ใช่คุณ:</strong></p>
                <p>กรุณาเปลี่ยนรหัสผ่านทันทีและติดต่อทีมสนับสนุน</p>
            </div>
        </div>
        
        <div class="footer">
            <p>ทีม {{appName}}</p>
        </div>
    </div>
</body>
</html>
    `
  },
  [EmailTemplate.API_KEY_CREATED]: {
    subject: 'API Key ใหม่ถูกสร้างแล้ว - {{appName}}',
    text: `
สวัสดี {{name}},

API Key ใหม่ถูกสร้างสำหรับบัญชีของคุณ:
- ชื่อ: {{keyName}}
- Prefix: {{keyPrefix}}
- สร้างเมื่อ: {{createdAt}}
- หมดอายุ: {{expires_at}}

กรุณาเก็บ API Key ไว้อย่างปลอดภัย

ทีม {{appName}}
    `,
    html: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>API Key ใหม่</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #9C27B0; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9f9f9; }
        .key-info { background: white; padding: 15px; border-radius: 4px; margin: 15px 0; border-left: 4px solid #9C27B0; }
        .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🔑 API Key ใหม่</h1>
        </div>
        
        <div class="content">
            <h2>สวัสดี {{name}}!</h2>
            
            <p>API Key ใหม่ถูกสร้างสำหรับบัญชีของคุณแล้ว</p>
            
            <div class="key-info">
                <h3>รายละเอียด API Key:</h3>
                <ul>
                    <li><strong>ชื่อ:</strong> {{keyName}}</li>
                    <li><strong>Prefix:</strong> {{keyPrefix}}</li>
                    <li><strong>สร้างเมื่อ:</strong> {{createdAt}}</li>
                    <li><strong>หมดอายุ:</strong> {{expires_at}}</li>
                </ul>
            </div>
            
            <p><strong>⚠️ กรุณาเก็บ API Key ไว้อย่างปลอดภัย เราจะไม่แสดงให้เห็นอีกครั้ง</strong></p>
        </div>
        
        <div class="footer">
            <p>ทีม {{appName}}</p>
        </div>
    </div>
</body>
</html>
    `
  },
  [EmailTemplate.OAUTH_LINKED]: {
    subject: 'บัญชี OAuth ถูกเชื่อมต่อแล้ว - {{appName}}',
    text: `
สวัสดี {{name}},

บัญชี {{provider}} ของคุณถูกเชื่อมต่อกับ {{appName}} เรียบร้อยแล้ว

คุณสามารถเข้าสู่ระบบผ่าน {{provider}} ได้แล้ว

ทีม {{appName}}
    `,
    html: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>OAuth เชื่อมต่อแล้ว</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #00BCD4; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9f9f9; }
        .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🔗 OAuth เชื่อมต่อแล้ว</h1>
        </div>
        
        <div class="content">
            <h2>สวัสดี {{name}}!</h2>
            
            <p>บัญชี <strong>{{provider}}</strong> ของคุณถูกเชื่อมต่อกับ {{appName}} เรียบร้อยแล้ว</p>
            
            <p>ตอนนี้คุณสามารถเข้าสู่ระบบผ่าน {{provider}} ได้แล้ว</p>
        </div>
        
        <div class="footer">
            <p>ทีม {{appName}}</p>
        </div>
    </div>
</body>
</html>
    `
  },
  [EmailTemplate.SECURITY_ALERT]: {
    subject: '🚨 แจ้งเตือนความปลอดภัย - {{appName}}',
    text: `
สวัสดี {{name}},

เราตรวจพบกิจกรรมที่น่าสงสัยในบัญชีของคุณ:

{{alertMessage}}

เวลา: {{timestamp}}
IP Address: {{ipAddress}}
ตำแหน่ง: {{location}}

กรุณาตรวจสอบบัญชีของคุณและเปลี่ยนรหัสผ่านหากจำเป็น

ทีม {{appName}}
    `,
    html: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>แจ้งเตือนความปลอดภัย</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #F44336; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9f9f9; }
        .alert { background: #ffebee; border: 1px solid #f8bbd9; padding: 15px; border-radius: 4px; margin: 15px 0; }
        .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🚨 แจ้งเตือนความปลอดภัย</h1>
        </div>
        
        <div class="content">
            <h2>สวัสดี {{name}}!</h2>
            
            <div class="alert">
                <p><strong>เราตรวจพบกิจกรรมที่น่าสงสัย:</strong></p>
                <p>{{alertMessage}}</p>
                
                <ul>
                    <li><strong>เวลา:</strong> {{timestamp}}</li>
                    <li><strong>IP Address:</strong> {{ipAddress}}</li>
                    <li><strong>ตำแหน่ง:</strong> {{location}}</li>
                </ul>
            </div>
            
            <p><strong>กรุณาดำเนินการทันที:</strong></p>
            <ul>
                <li>ตรวจสอบบัญชีของคุณ</li>
                <li>เปลี่ยนรหัสผ่านหากจำเป็น</li>
                <li>ติดต่อทีมสนับสนุนหากมีปัญหา</li>
            </ul>
        </div>
        
        <div class="footer">
            <p>ทีม {{appName}}</p>
        </div>
    </div>
</body>
</html>
    `
  }
};

export * from './welcome.template';
export * from './email-verification.template';
export * from './password-reset.template';
